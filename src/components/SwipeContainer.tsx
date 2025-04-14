import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { lightHapticFeedback, mediumHapticFeedback } from '@/lib/haptics';

interface SwipeContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance to trigger swipe
  disabled?: boolean;
}

export function SwipeContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  disabled = false,
}: SwipeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null); // Track vertical position too
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false); // Track if user is scrolling vertically
  const location = useLocation();
  const pathname = location.pathname;

  // Helper to safely check if an element is an input/scrollable area
  const isInputOrScrollable = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false;
    
    // Check if element is an interactive form element
    const tagName = target.tagName.toLowerCase();
    if (['input', 'textarea', 'select', 'button', 'a', 'label'].includes(tagName)) {
      return true;
    }

    // Check for elements with roles
    const role = target.getAttribute('role');
    if (role && ['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem'].includes(role)) {
      return true;
    }
    
    // Check for contentEditable
    if (target.hasAttribute('contenteditable')) {
      return true;
    }
    
    // Check if element or any parent has overflow that can scroll
    let el: Element | null = target;
    while (el) {
      const style = window.getComputedStyle(el);
      
      // Check for horizontal scrolling
      if (['auto', 'scroll'].includes(style.overflowX) && 
          el.scrollWidth > el.clientWidth) {
        // If element has horizontal scroll capability, check if it's actually scrolled
        if (el.scrollLeft > 0 || el.scrollLeft < el.scrollWidth - el.clientWidth) {
          return true;
        }
      }
      
      // Check for common UI components that shouldn't trigger swipe
      if (el.classList.contains('slider') || 
          el.classList.contains('carousel') || 
          el.classList.contains('scrollable')) {
        return true;
      }
      
      el = el.parentElement;
    }
    
    return false;
  }, []);

  // Memoize handlers to prevent unnecessary recreations
  const memoizedSwipeLeft = useCallback(() => {
    if (onSwipeLeft) onSwipeLeft();
  }, [onSwipeLeft]);

  const memoizedSwipeRight = useCallback(() => {
    if (onSwipeRight) onSwipeRight();
  }, [onSwipeRight]);

  // Reset swipe state when location changes
  useEffect(() => {
    setTouchStartX(null);
    setTouchStartY(null);
    setIsSwiping(false);
    setIsScrolling(false);
    setSwipeOffset(0);
  }, [pathname]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't initialize swipe if disabled or if starting from an input/scrollable element
    if (disabled || isInputOrScrollable(e.target)) return;
    
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY); // Track starting Y position
    setIsSwiping(true);
    setIsScrolling(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || disabled || touchStartX === null || touchStartY === null) return;

    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    
    // Calculate delta for both X and Y
    const deltaX = currentX - touchStartX;
    const deltaY = currentY - touchStartY;
    
    // If we haven't determined direction yet, check if this is a horizontal or vertical gesture
    if (!isScrolling && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
      // User is scrolling vertically more than horizontally
      setIsScrolling(true);
      setIsSwiping(false);
      return;
    }
    
    // If user is primarily scrolling vertically, don't handle the swipe
    if (isScrolling) return;

    // Calculate the swipe offset for visual feedback
    const offset = deltaX;

    // Limit the maximum offset and apply resistance
    const maxOffset = 100;
    const resistedOffset = Math.sign(offset) * Math.min(Math.abs(offset) * 0.5, maxOffset);

    // Provide haptic feedback at certain thresholds
    if (Math.abs(offset) > threshold && Math.abs(swipeOffset) <= threshold) {
      lightHapticFeedback();
    }

    // Prevent default to avoid browser navigation/overscroll
    if (Math.abs(deltaX) > 10 && Math.abs(deltaY) < 10) {
      e.preventDefault();
    }

    setSwipeOffset(resistedOffset);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping || !touchStartX || disabled || isScrolling) return;
    
    // Calculate the distance swiped
    const touchEnd = e.changedTouches[0].clientX;
    
    const distance = touchEnd - touchStartX;
    const absDistance = Math.abs(distance);
    
    // Reset swiping states
    setIsSwiping(false);
    setIsScrolling(false);
    setSwipeOffset(0);
    
    // If swipe distance is greater than threshold, trigger swipe actions
    if (absDistance > threshold) {
      // Provide haptic feedback if available
      mediumHapticFeedback();
      
      // Call the appropriate callback based on swipe direction
      if (distance > 0 && memoizedSwipeRight) {
        memoizedSwipeRight();
      } else if (distance < 0 && memoizedSwipeLeft) {
        memoizedSwipeLeft();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        setIsSwiping(false);
        setIsScrolling(false);
        setTouchStartX(null);
        setTouchStartY(null); 
        setSwipeOffset(0);
      }}
      className="relative w-full h-full"
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {children}
    </div>
  );
}
