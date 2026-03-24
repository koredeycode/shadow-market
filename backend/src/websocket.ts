import { Server } from 'socket.io';

export function setupWebSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Subscribe to market updates
    socket.on('subscribe:market', ({ marketId }) => {
      socket.join(`market:${marketId}`);
      console.log(`Client ${socket.id} subscribed to market ${marketId}`);
    });

    // Unsubscribe from market
    socket.on('unsubscribe:market', ({ marketId }) => {
      socket.leave(`market:${marketId}`);
      console.log(`Client ${socket.id} unsubscribed from market ${marketId}`);
    });

    // Subscribe to user updates
    socket.on('subscribe:user', ({ userId }) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

// Broadcast market update
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
  io.to(`market:${marketId}`).emit('market:update', {
    marketId,
    ...data,
    timestamp: Date.now(),
  });
}
