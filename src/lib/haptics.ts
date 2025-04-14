/**
 * Advanced utility functions for haptic feedback on mobile devices
 */

// Check if the device supports vibration
const hasVibration = (): boolean => {
  return 'vibrate' in navigator;
};

// Check if the device is iOS
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Check if the device is Android
const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent);
};

// Check if we're running in a mobile context
export const isMobileDevice = (): boolean => {
  return isIOS() || isAndroid() || window.innerWidth < 768;
};

/**
 * Trigger a light haptic feedback (short vibration)
 * Ideal for UI element interaction like button presses
 */
export const lightHapticFeedback = (): void => {
  if (hasVibration()) {
    // Use different patterns for Android vs other devices
    if (isAndroid()) {
      navigator.vibrate(5); // Shorter for Android
    } else {
      navigator.vibrate(10); // 10ms vibration
    }
  }
};

/**
 * Trigger a medium haptic feedback (medium vibration)
 * Good for confirming an action or selection
 */
export const mediumHapticFeedback = (): void => {
  if (hasVibration()) {
    navigator.vibrate(20); // 20ms vibration
  }
};

/**
 * Trigger a heavy haptic feedback (longer vibration)
 * Appropriate for significant events like task completion
 */
export const heavyHapticFeedback = (): void => {
  if (hasVibration()) {
    // Different patterns for different devices
    if (isAndroid()) {
      navigator.vibrate(35); // Slightly longer for Android
    } else {
      navigator.vibrate(30); // 30ms vibration
    }
  }
};

/**
 * Trigger a success haptic feedback (double vibration)
 * Use when an operation has completed successfully
 */
export const successHapticFeedback = (): void => {
  if (hasVibration()) {
    navigator.vibrate([10, 30, 10]); // pattern: vibrate, pause, vibrate
  }
};

/**
 * Trigger an error haptic feedback (triple vibration)
 * Use when an operation has failed
 */
export const errorHapticFeedback = (): void => {
  if (hasVibration()) {
    navigator.vibrate([30, 20, 30, 20, 30]); // pattern: vibrate, pause, vibrate, pause, vibrate
  }
};

/**
 * Trigger a notification haptic feedback
 * Good for alerts, incoming messages, etc.
 */
export const notificationHapticFeedback = (): void => {
  if (hasVibration()) {
    navigator.vibrate([10, 50, 20]); // pattern: short, pause, medium
  }
};

/**
 * Trigger a selection change haptic feedback
 * Subtle feedback for selecting items in a list
 */
export const selectionHapticFeedback = (): void => {
  if (hasVibration()) {
    navigator.vibrate(8); // Very short vibration
  }
};

/**
 * Trigger a swipe action haptic feedback
 * For swipe gestures and confirming swipe actions
 */
export const swipeHapticFeedback = (): void => {
  if (hasVibration()) {
    navigator.vibrate([5, 10, 10]); // Quick double tap feeling
  }
};

/**
 * Trigger a tap haptic feedback
 * Subtle feedback for standard taps
 */
export const tapHapticFeedback = (): void => {
  if (hasVibration()) {
    navigator.vibrate(3); // Very quick tap
  }
};

/**
 * Trigger a custom haptic feedback pattern
 * @param pattern Array of durations in milliseconds where even indices are vibration durations and odd indices are pause durations
 */
export const customHapticFeedback = (pattern: number[]): void => {
  if (hasVibration()) {
    navigator.vibrate(pattern);
  }
};
