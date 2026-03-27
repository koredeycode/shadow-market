import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { adminRouter } from './routes/admin.js';
import { marketsRouter } from './routes/markets.js';
import { oraclesRouter } from './routes/oracles.js';
import { usersRouter } from './routes/users.js';
import { wagersRouter } from './routes/wagers.js';

// Create Express app
export const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API Routes
app.use('/api/admin', adminRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/oracles', oraclesRouter);
app.use('/api/users', usersRouter);
app.use('/api/wagers', wagersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});
