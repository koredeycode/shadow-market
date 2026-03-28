import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config.js';
import logger from './utils/logger.js';

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
    logger.info('WebSocket client connected', { socketId: socket.id });

    // Subscribe to market updates
    socket.on('subscribe:market', ({ marketId }: { marketId: string }) => {
      socket.join(`market:${marketId}`);
      logger.debug('Client subscribed to market', {
        socketId: socket.id,
        marketId,
        type: 'market',
      });
    });

    // Unsubscribe from market
    socket.on('unsubscribe:market', ({ marketId }: { marketId: string }) => {
      socket.leave(`market:${marketId}`);
      logger.debug('Client unsubscribed from market', {
        socketId: socket.id,
        marketId,
        type: 'market',
      });
    });

    // Subscribe to user updates
    socket.on('subscribe:user', ({ userId }: { userId: string }) => {
      socket.join(`user:${userId}`);
      logger.debug('Client subscribed to user', { socketId: socket.id, userId, type: 'user' });
    });

    // Unsubscribe from user
    socket.on('unsubscribe:user', ({ userId }: { userId: string }) => {
      socket.leave(`user:${userId}`);
      logger.debug('Client unsubscribed from user', { socketId: socket.id, userId, type: 'user' });
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', reason => {
      logger.info('WebSocket client disconnected', { socketId: socket.id, reason });
    });

    socket.on('error', error => {
      logger.error('WebSocket error', { socketId: socket.id, error });
    });
  });

  logger.info('WebSocket server initialized', {
    corsOrigin: config.corsOrigin,
    transports: ['websocket', 'polling'],
  });
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
