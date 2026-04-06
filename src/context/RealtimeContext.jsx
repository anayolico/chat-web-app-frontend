// Real-time context provider for managing Socket.IO connections
// This context handles real-time features like user presence and typing indicators
// using WebSocket connections for instant updates

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

// Create the real-time context
const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const { auth, isAuthenticated } = useAuth();
  // State for tracking user presence (online/offline status)
  const [presenceByUser, setPresenceByUser] = useState({});
  // State for tracking typing indicators by user
  const [typingByUser, setTypingByUser] = useState({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState('');
  const typingTimeoutsRef = useRef({});

  // Effect to manage Socket.IO connection based on authentication
  useEffect(() => {
    // Disconnect if not authenticated
    if (!isAuthenticated || !auth?.token) {
      disconnectSocket();
      setPresenceByUser({});
      setTypingByUser({});
      setIsSocketConnected(false);
      setSocketError('');
      return undefined;
    }

    // Connect socket with auth token
    const socket = connectSocket(auth.token);

    // Handler for presence updates (user online/offline)
    const handlePresenceUpdate = (payload) => {
      setPresenceByUser((current) => ({
        ...current,
        [payload.userId]: {
          isOnline: payload.isOnline,
          lastSeen: payload.lastSeen || null
        }
      }));
    };

    // Handler for typing indicators
    const handleTypingUpdate = (payload) => {
      const userId = payload.userId;

      if (typingTimeoutsRef.current[userId]) {
        clearTimeout(typingTimeoutsRef.current[userId]);
        delete typingTimeoutsRef.current[userId];
      }

      setTypingByUser((current) => ({
        ...current,
        [userId]: Boolean(payload.isTyping)
      }));

      if (payload.isTyping) {
        typingTimeoutsRef.current[userId] = setTimeout(() => {
          setTypingByUser((current) => ({
            ...current,
            [userId]: false
          }));
          delete typingTimeoutsRef.current[userId];
        }, 1500);
      }
    };

    const handleConnect = () => {
      setIsSocketConnected(true);
      setSocketError('');
    };

    const handleDisconnect = (reason) => {
      setIsSocketConnected(false);
      setSocketError(reason || '');
    };

    const handleConnectError = (connectionError) => {
      setIsSocketConnected(false);
      setSocketError(connectionError?.message || 'Socket connection failed');
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('user_online', handlePresenceUpdate);
    socket.on('user_offline', handlePresenceUpdate);
    socket.on('typing:update', handleTypingUpdate);
    socket.on('typing', handleTypingUpdate);

    // Cleanup function: remove listeners and disconnect
    return () => {
      Object.values(typingTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
      typingTimeoutsRef.current = {};
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('user_online', handlePresenceUpdate);
      socket.off('user_offline', handlePresenceUpdate);
      socket.off('typing:update', handleTypingUpdate);
      socket.off('typing', handleTypingUpdate);
      disconnectSocket();
    };
  }, [auth?.token, isAuthenticated]);

  // Memoized context value
  const value = useMemo(
    () => ({
      presenceByUser,
      isSocketConnected,
      socketError,
      typingByUser,
      // Function to emit events to the server
      emit: (eventName, payload) => {
        const socket = getSocket();

        if (!socket) {
          return;
        }

        socket.emit(eventName, payload);
      }
    }),
    [isSocketConnected, presenceByUser, socketError, typingByUser]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

// Custom hook to use the real-time context
export function useRealtime() {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error('useRealtime must be used inside RealtimeProvider');
  }

  return context;
}
