import http from 'http';
import { app } from './app.js';
import { config } from './config.js';
import { testConnection } from './db/client.js';
import { runMigrations } from './db/migrations.js';
import { initializeAdmin } from './services/admin-init.service.js';
import { initWebSocket } from './websocket.js';

const server = http.createServer(app);

// Initialize WebSocket server
initWebSocket(server);

// Test database connection
async function startServer() {
  try {
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Run migrations
    const migrationsOk = await runMigrations();
    if (!migrationsOk) {
      console.error('❌ Failed to run migrations');
      process.exit(1);
    }

    // Initialize admin user
    await initializeAdmin();

    server.listen(config.port, () => {
      console.log(`✅ Backend server running on http://${config.host}:${config.port}`);
      console.log(`✅ WebSocket server ready`);
      console.log(`✅ Database connected`);
      console.log(`✅ Migrations applied`);
      console.log(`✅ Admin user initialized`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
