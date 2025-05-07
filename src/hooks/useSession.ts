/**
 * useSession Hook
 * 
 * Provides comprehensive session management for the application.
 * Handles authentication state, token refresh, and session expiry.
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from '@shared/types';
import { AuthService } from '@/services/auth.service';
import { onNetworkStatusChange, isNetworkOnline } from '@/services/offline.service';

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Session storage keys
const SESSION_LAST_ACTIVE_KEY = 'fairshare_session_last_active';
const SESSION_TOKEN_KEY = 'fairshare_session_token';

interface SessionState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  isOffline: boolean;
  error: Error | null;
  lastActive: number | null;
}

interface SessionActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => void;
}

export function useSession(): [SessionState, SessionActions] {
  const [state, setState] = useState<SessionState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isSessionExpired: false,
    isOffline: !isNetworkOnline(),
    error: null,
    lastActive: null
  });

  // Update last active timestamp
  const updateLastActive = useCallback(() => {
    const now = Date.now();
    sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
    setState(prev => ({ ...prev, lastActive: now }));
  }, []);

  // Check if session has expired
  const checkSessionExpiry = useCallback(() => {
    const lastActive = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);
    if (!lastActive) return true;
    
    const timeSinceLastActive = Date.now() - parseInt(lastActive, 10);
    return timeSinceLastActive > SESSION_TIMEOUT;
  }, []);

  // Set session token
  const setSessionToken = useCallback((token: string | null) => {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }, []);

  // Login with Google
  const login = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await AuthService.signInWithGoogle();
      
      // Session is now active
      updateLastActive();
      
      // User will be set by the auth state listener
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to sign in')
      }));
    }
  }, [updateLastActive]);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await AuthService.signOut();
      
      // Clear session data
      setSessionToken(null);
      sessionStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isSessionExpired: false,
        isOffline: state.isOffline,
        error: null,
        lastActive: null
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to sign out')
      }));
    }
  }, [state.isOffline, setSessionToken]);

  // Setup auth state listener
  useEffect(() => {
    // Check for session expiry on mount
    const isExpired = checkSessionExpiry();
    
    // Listen for auth state changes
    const { data: authListener } = AuthService.onAuthStateChange((user: User | null) => {
      if (user) {
        // Generate a simple session token
        const mockToken = `session_${Date.now()}`;
        setSessionToken(mockToken);
        setState(prev => ({
          ...prev,
          user,
          isLoading: false,
          isAuthenticated: true,
          isSessionExpired: isExpired
        }));
      } else {
        setSessionToken(null);
        setState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          isAuthenticated: false,
          lastActive: null
        }));
      }
    });
    
    // If user is already authenticated when component mounts
    (async () => {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser && !isExpired) {
        updateLastActive();
      }
    })();
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkSessionExpiry, setSessionToken, updateLastActive]);

  // Setup session expiry checker
  useEffect(() => {
    // Check session every minute
    const interval = setInterval(() => {
      if (state.isAuthenticated) {
        const isExpired = checkSessionExpiry();
        if (isExpired) {
          setState(prev => ({ ...prev, isSessionExpired: true }));
        }
      }
    }, 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [state.isAuthenticated, checkSessionExpiry]);

  // Setup network status listener
  useEffect(() => {
    const unsubscribe = onNetworkStatusChange((isOnline) => {
      setState(prev => ({ ...prev, isOffline: !isOnline }));
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return [state, { login, logout, refreshSession: updateLastActive }];
} 