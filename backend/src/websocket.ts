import { Server } from 'socket.io';
import type { WebSocketEvents } from './types';

export function setupWebSocket(io: Server) {
  io.on('connection', (socket) => {
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

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('🌐 WebSocket server initialized');
}

/**
 * Broadcast market price update
 */
export function broadcastMarketUpdate(
  io: Server,
  marketId: string,
  data: {
    yesPrice: string;
    noPrice: string;
    totalVolume: string;
    totalLiquidity: string;
  }
) {
  const event: WebSocketEvents['market:update'] = {
    marketId,
    ...data,
    timestamp: Date.now(),
  };

  io.to(`market:${marketId}`).emit('market:update', event);
  console.log(`📡 Broadcast market update for ${marketId}`);
}

/**
 * Broadcast market resolution
 */
export function broadcastMarketResolved(
  io: Server,
  marketId: string,
  outcome: number
) {
  const event: WebSocketEvents['market:resolved'] = {
    marketId,
    outcome,
    timestamp: Date.now(),
  };

  io.to(`market:${marketId}`).emit('market:resolved', event);
  console.log(`🎯 Broadcast market resolved: ${marketId} => ${outcome}`);
}

/**
 * Notify user of position update
 */
export function notifyPositionUpdate(
  io: Server,
  userId: string,
  data: {
    marketId: string;
    value: string;
    profitLoss: string;
  }
) {
  const event: WebSocketEvents['position:update'] = {
    ...data,
  };

  io.to(`user:${userId}`).emit('position:update', event);
}

/**
 * Notify wager matched
 */
export function notifyWagerMatched(
  io: Server,
  creatorId: string,
  wagerId: string,
  takerAddress: string
) {
  const event: WebSocketEvents['wager:matched'] = {
    wagerId,
    taker: takerAddress,
  };

  io.to(`user:${creatorId}`).emit('wager:matched', event);
  console.log(`🤝 Notify wager matched: ${wagerId}`);
}

/**
 * Broadcast to all connected clients
 */
export function broadcastGlobal(
  io: Server,
  event: string,
  data: any
) {
  io.emit(event, data);
}

/**
 * Get connection statistics
 */
export function getConnectionStats(io: Server) {
  const sockets = io.sockets.sockets;
  const rooms = io.sockets.adapter.rooms;

  return {
    totalConnections: sockets.size,
    totalRooms: rooms.size,
    timestamp: Date.now(),
  };
}
