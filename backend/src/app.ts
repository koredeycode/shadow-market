import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { config } from './config';
import { testConnection } from './db/client';
import { startBackgroundJobs } from './db/jobs';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import { marketsRouter } from './routes/markets';
import { oraclesRouter } from './routes/oracles';
import { usersRouter } from './routes/users';
import { wagersRouter } from './routes/wagers';
import { getConnectionStats, setupWebSocket } from './websocket';

// Create Express app
export const app = express();
const httpServer = createServer(app);

// Setup WebSocket
export const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

setupWebSocket(io);

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket stats
app.get('/ws/stats', (req, res) => {
  const stats = getConnectionStats(io);
  res.json({ success: true, data: stats });
});

// API Routes
app.use('/api/markets', marketsRouter);
app.use('/api/wagers', wagersRouter);
app.use('/api/oracles', oraclesRouter);
app.use('/api/users', usersRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
export async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Start background jobs
    if (config.nodeEnv === 'production' || config.nodeEnv === 'development') {
      startBackgroundJobs();
    }

    // Start listening
    httpServer.listen(config.port, () => {
      console.log('');
      console.log('🚀 ShadowMarket Backend Server');
      console.log(`📍 Server: http://${config.host}:${config.port}`);
      console.log(`🌐 WebSocket: ws://${config.host}:${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`💾 Database: Connected`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start if not in test mode
if (require.main === module) {
  startServer();
}
