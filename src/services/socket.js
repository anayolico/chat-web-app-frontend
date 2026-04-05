import { io } from 'socket.io-client';

let socket;

export function connectSocket(token) {
  if (!token) {
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    autoConnect: true,
    auth: {
      token
    }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
