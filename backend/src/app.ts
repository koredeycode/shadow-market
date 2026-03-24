import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { testConnection } from './db/client';
import { marketsRouter } from './routes/markets';
import { wagersRouter } from './routes/wagers';
import { oraclesRouter } from './routes/oracles';
import { usersRouter } from './routes/users';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import { setupWebSocket } from './websocket';

// Create Express app
export const app = express();
const httpServer = createServer(app);

// Setup WebSocket
export const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
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

    // Start listening
    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on http://${config.host}:${config.port}`);
      console.log(`🌐 WebSocket server ready`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
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

// Start if not in test mode
if (require.main === module) {
  startServer();
}
