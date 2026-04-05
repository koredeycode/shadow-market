import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Successfully connected to transmission tower');
});

socket.on('disconnect', () => {
  console.log('Lost connection to transmission tower');
});
