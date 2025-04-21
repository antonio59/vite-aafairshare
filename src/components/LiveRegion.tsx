import { useEffect, useState } from 'react';

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
  assertive,
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
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

// Create a global announcement system
let announceCallback: ((_message: string, _assertive?: boolean) => void) | null = null;

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
export function announce(_message: string, _assertive = false) {
  if (announceCallback) {
    announceCallback(_message, _assertive);
  } else {
    console.warn('LiveRegionAnnouncer not mounted');
  }
}
