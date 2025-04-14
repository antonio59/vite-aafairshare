import { useEffect, useRef } from 'react';

/**
 * Hook to trap focus within a container for accessibility
 * @param active Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap(active = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Find all focusable elements
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element when the trap becomes active
    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Save the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Remove event listener
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus when the trap is deactivated
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return containerRef;
}
