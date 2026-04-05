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
  const typingTimeoutsRef = useRef({});

  // Effect to manage Socket.IO connection based on authentication
  useEffect(() => {
    // Disconnect if not authenticated
    if (!isAuthenticated || !auth?.token) {
      disconnectSocket();
      setPresenceByUser({});
      setTypingByUser({});
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

    // Register event listeners
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('typing:update', handleTypingUpdate);

    // Cleanup function: remove listeners and disconnect
    return () => {
      Object.values(typingTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
      typingTimeoutsRef.current = {};
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('typing:update', handleTypingUpdate);
      disconnectSocket();
    };
  }, [auth?.token, isAuthenticated]);

  // Memoized context value
  const value = useMemo(
    () => ({
      presenceByUser,
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
    [presenceByUser, typingByUser]
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
