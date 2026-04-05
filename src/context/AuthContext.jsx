// Authentication context provider for managing user authentication state
// This context provides authentication state and methods throughout the app,
// including login, logout, user updates, and persistent storage

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authApi } from '../services/authApi';
import { getStoredAuth, persistAuth, removeStoredAuth } from '../utils/storage';

// Create the authentication context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // State for current authentication data (token and user)
  const [auth, setAuth] = useState(() => getStoredAuth());
  // Loading state for initial authentication check
  const [isLoading, setIsLoading] = useState(true);

  // Effect to validate stored auth token on app startup
  useEffect(() => {
    const bootAuth = async () => {
      // If no token, skip validation
      if (!auth?.token) {
        setIsLoading(false);
        return;
      }

      try {
        // Validate token by fetching current user
        const response = await authApi.getCurrentUser();
        const nextAuth = {
          token: auth.token,
          user: response.data.data.user
        };

        setAuth(nextAuth);
        persistAuth(nextAuth);
      } catch (_error) {
        // Token invalid, clear auth
        setAuth(null);
        removeStoredAuth();
      } finally {
        setIsLoading(false);
      }
    };

    bootAuth();
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.token),
      isLoading,
      // Login function: sets auth state and persists to storage
      login: (payload) => {
        setAuth(payload);
        persistAuth(payload);
      },
      // Logout function: clears auth state and removes from storage
      logout: () => {
        setAuth(null);
        removeStoredAuth();
      },
      // Update user data while keeping the token
      updateUser: (user) => {
        setAuth((current) => {
          if (!current) {
            return current;
          }

          const nextAuth = {
            ...current,
            user
          };

          persistAuth(nextAuth);
          return nextAuth;
        });
      }
    }),
    [auth, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the authentication context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
