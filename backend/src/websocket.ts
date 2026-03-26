import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';

let io: Server | null = null;

export function initWebSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', socket => {
    console.log('✅ Client connected:', socket.id);

    // Subscribe to market updates
    socket.on('subscribe:market', ({ marketId }: { marketId: string }) => {
      socket.join(`market:${marketId}`);
      console.log(`📊 Client ${socket.id} subscribed to market ${marketId}`);
    });

    // Unsubscribe from market
    socket.on('unsubscribe:market', ({ marketId }: { marketId: string }) => {
      socket.leave(`market:${marketId}`);
      console.log(`📊 Client ${socket.id} unsubscribed from market ${marketId}`);
    });

    // Subscribe to user updates
    socket.on('subscribe:user', ({ userId }: { userId: string }) => {
      socket.join(`user:${userId}`);
      console.log(`👤 Client ${socket.id} subscribed to user ${userId}`);
    });

    // Unsubscribe from user
    socket.on('unsubscribe:user', ({ userId }: { userId: string }) => {
      socket.leave(`user:${userId}`);
      console.log(`👤 Client ${socket.id} unsubscribed from user ${userId}`);
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', reason => {
      console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', error => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('🌐 WebSocket server initialized');
  return io;
}

export function getIO(): Server | null {
  return io;
}

// Helper functions for broadcasting events (for future use)
export function broadcastToMarket(marketId: string, event: string, data: any) {
  if (io) {
    io.to(`market:${marketId}`).emit(event, data);
  }
}

export function broadcastToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}
