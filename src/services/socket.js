import { io } from 'socket.io-client';
import { resolveBackendOriginForClient } from '../utils/mediaUrl';

let socket;
let activeToken = null;

const DEFAULT_SOCKET_URL = 'https://chat-web-app-backend-f56m.onrender.com';
const resolveSocketUrl = () =>
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_PUBLIC_URL ||
  resolveBackendOriginForClient() ||
  DEFAULT_SOCKET_URL;

export function connectSocket(token) {
  if (!token) {
    return null;
  }

  if (socket && activeToken === token) {
    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  activeToken = token;
  socket = io(resolveSocketUrl(), {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    auth: {
      token
    }
  });

  socket.connect();

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    activeToken = null;
  }
}
