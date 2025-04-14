import React, { useEffect, useState } from 'react';

interface LiveRegionProps {
  message: string;
  assertive?: boolean;
  clearAfter?: number;
}

/**
 * Component for announcing messages to screen readers
 * @param message The message to announce
 * @param assertive Whether to use assertive politeness (default: false)
 * @param clearAfter Time in ms after which to clear the message (default: 5000)
 */
export function LiveRegion({ 
  message, 
  assertive = false, 
  clearAfter = 5000 
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  if (!currentMessage) return null;

  return (
    <div
      className="sr-only"
      role="status"
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {currentMessage}
    </div>
  );
}

// Create a global announcement system
let announceCallback: ((message: string, assertive?: boolean) => void) | null = null;

export function LiveRegionAnnouncer() {
  const [message, setMessage] = useState('');
  const [assertive, setAssertive] = useState(false);

  useEffect(() => {
    announceCallback = (newMessage: string, isAssertive = false) => {
      setMessage(newMessage);
      setAssertive(isAssertive);
    };

    return () => {
      announceCallback = null;
    };
  }, []);

  return <LiveRegion message={message} assertive={assertive} />;
}

/**
 * Announce a message to screen readers
 * @param message The message to announce
 * @param assertive Whether to use assertive politeness (default: false)
 */
export function announce(message: string, assertive = false) {
  if (announceCallback) {
    announceCallback(message, assertive);
  } else {
    console.warn('LiveRegionAnnouncer not mounted');
  }
}
