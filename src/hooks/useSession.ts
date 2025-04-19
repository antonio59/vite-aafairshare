/**
 * useSession Hook
 * 
 * Provides comprehensive session management for the application.
 * Handles authentication state, token refresh, and session expiry.
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from '@shared/types';
import { 
  onAuthStateChange, 
  signInWithGoogle, 
  logout as signOutUser, 
  getCurrentUser 
} from '@/services/auth.service';
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

export interface SessionActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => void;
  updateLastActive: () => void;
}

/**
 * Hook for comprehensive session management
 * 
 * @returns Session state and actions
 */
export function useSession(): [SessionState, SessionActions] {
  // Session state
  const [state, setState] = useState<SessionState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isSessionExpired: false,
    isOffline: !isNetworkOnline(),
    error: null,
    lastActive: getLastActiveTime()
  });

  // Save session token to storage
  const setSessionToken = useCallback((token: string | null): void => {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }, []);

  // Update last active timestamp
  const updateLastActive = useCallback((): void => {
    const now = Date.now();
    sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
    setState(prev => ({ ...prev, lastActive: now, isSessionExpired: false }));
  }, []);

  // Get last active time from storage
  function getLastActiveTime(): number | null {
    const time = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);
    return time ? parseInt(time, 10) : null;
  }

  // Check if session is expired
  const checkSessionExpiry = useCallback((): boolean => {
    const lastActive = getLastActiveTime();
    if (!lastActive) return false;
    
    const now = Date.now();
    const timeSinceLastActive = now - lastActive;
    
    return timeSinceLastActive > SESSION_TIMEOUT;
  }, []);

  // Refresh the session
  const refreshSession = useCallback(async (): Promise<void> => {
    // Reset session expiry
    updateLastActive();
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (user) {
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        isSessionExpired: false,
        error: null
      }));
    }
  }, [updateLastActive]);

  // Login with Google
  const login = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await signInWithGoogle();
      
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
      
      await signOutUser();
      
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
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        // Generate a simple session token (in a real app, you'd use Firebase's getIdToken)
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
      const currentUser = await getCurrentUser();
      if (currentUser && !isExpired) {
        updateLastActive();
      }
    })();
    
    return () => {
      unsubscribe();
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

  // Setup activity tracking
  useEffect(() => {
    if (!state.isAuthenticated) return;
    
    // Update last active time on user interaction
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleUserActivity = () => {
      updateLastActive();
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [state.isAuthenticated, updateLastActive]);

  // Setup network status listener
  useEffect(() => {
    const unsubscribe = onNetworkStatusChange((online) => {
      setState(prev => ({ ...prev, isOffline: !online }));
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Exposed actions
  const actions: SessionActions = {
    login,
    logout,
    refreshSession,
    updateLastActive
  };

  return [state, actions];
} 