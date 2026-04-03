import http from 'http';
import { app } from './app.js';
import { config } from './config.js';
import { testConnection } from './db/client.js';
import { runMigrations } from './db/migrations.js';
import { initializeAdmin } from './services/admin-init.service.js';
import logger from './utils/logger.js';
import { initWebSocket } from './websocket.js';

// Global BigInt serialization for JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const server = http.createServer(app);

// Initialize WebSocket server
initWebSocket(server);

// Test database connection
async function startServer() {
  try {
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Run migrations
    const migrationsOk = await runMigrations();
    if (!migrationsOk) {
      logger.error('Failed to run migrations');
      process.exit(1);
    }

    // Initialize admin user
    await initializeAdmin();

    server.listen(config.port, () => {
      logger.info(`Backend server running on http://${config.host}:${config.port}`);
      logger.info('Server initialization complete', {
        websocket: 'ready',
        database: 'connected',
        migrations: 'applied',
        admin: 'initialized',
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'debug',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT signal, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception', { error, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});
