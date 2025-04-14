/**
 * SessionManager Component
 * 
 * Provides UI for managing the user's session, including:
 * - Session timeout warnings
 * - Offline status indicators
 * - Session refresh options
 */

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, LogOut } from 'lucide-react';

// Time before session expiry to show warning (5 minutes)
const WARNING_THRESHOLD = 5 * 60 * 1000;

export function SessionManager() {
  const [state, actions] = useSession();
  const { 
    isAuthenticated, 
    isSessionExpired, 
    isOffline, 
    lastActive 
  } = state;

  const [showWarning, setShowWarning] = useState(false);

  // Check if session will expire soon
  useEffect(() => {
    if (!isAuthenticated || !lastActive) {
      setShowWarning(false);
      return;
    }

    const checkSessionWarning = () => {
      const now = Date.now();
      const sessionTimeout = 30 * 60 * 1000; // Must match the value in useSession
      const timeUntilExpiry = (lastActive + sessionTimeout) - now;
      
      setShowWarning(timeUntilExpiry > 0 && timeUntilExpiry < WARNING_THRESHOLD);
    };

    // Check immediately and then every minute
    checkSessionWarning();
    const interval = setInterval(checkSessionWarning, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, lastActive]);

  // Handle session refresh
  const handleRefreshSession = () => {
    actions.refreshSession();
    setShowWarning(false);
  };

  // If not authenticated, don't show anything
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {/* Offline indicator */}
      {isOffline && (
        <Alert 
          className="bg-amber-100 border-amber-300 text-amber-800 p-3 rounded-md shadow-md flex items-center"
        >
          <WifiOff className="h-4 w-4 mr-2" />
          <span className="text-sm">You are offline. Some features may be limited.</span>
        </Alert>
      )}

      {/* Online indicator - only show briefly when coming back online */}
      {!isOffline && (
        <div className="flex items-center text-green-700 text-sm">
          <Wifi className="h-4 w-4 mr-1" />
          <span>Online</span>
        </div>
      )}

      {/* Session expired alert */}
      {isSessionExpired && (
        <Alert 
          className="bg-red-100 border-red-300 text-red-800 p-4 rounded-md shadow-md"
        >
          <h4 className="font-semibold mb-2">Session Expired</h4>
          <p className="text-sm mb-3">Your session has expired due to inactivity.</p>
          <div className="flex space-x-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleRefreshSession}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Session
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => actions.logout()}
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </Alert>
      )}

      {/* Session expiring soon warning */}
      {showWarning && !isSessionExpired && (
        <Alert 
          className="bg-amber-100 border-amber-300 text-amber-800 p-4 rounded-md shadow-md"
        >
          <h4 className="font-semibold mb-2">Session Expiring Soon</h4>
          <p className="text-sm mb-3">Your session will expire soon due to inactivity.</p>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleRefreshSession}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Keep Session Active
          </Button>
        </Alert>
      )}
    </div>
  );
} 