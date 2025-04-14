/**
 * useRetry Hook
 * 
 * A hook that provides retry functionality for asynchronous operations.
 * Useful for handling transient network errors and other recoverable failures.
 */

import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  backoffFactor?: number;
  maxDelay?: number;
  onError?: (error: unknown, attempt: number, willRetry: boolean) => void;
}

interface UseRetryResult<T> {
  execute: (operation: () => Promise<T>) => Promise<T>;
  reset: () => void;
  isLoading: boolean;
  error: unknown | null;
  attempt: number;
}

/**
 * A hook that provides retry functionality for asynchronous operations
 * 
 * @param options - Configuration options for retry behavior
 * @returns Object with execute function, reset function, and status information
 */
export function useRetry<T = any>({
  maxRetries = 3,
  initialDelay = 1000,
  backoffFactor = 2,
  maxDelay = 30000,
  onError
}: UseRetryOptions = {}): UseRetryResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // Calculate delay time with exponential backoff
  const getDelayTime = useCallback((attemptNumber: number): number => {
    const delay = initialDelay * Math.pow(backoffFactor, attemptNumber - 1);
    return Math.min(delay, maxDelay);
  }, [initialDelay, backoffFactor, maxDelay]);

  // Reset the retry state
  const reset = useCallback(() => {
    setAttempt(0);
    setIsLoading(false);
    setError(null);
  }, []);

  // Execute the operation with retry logic
  const execute = useCallback(async (operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    // Retry loop
    let currentAttempt = 1;
    
    while (currentAttempt <= maxRetries + 1) {
      try {
        setAttempt(currentAttempt);
        const result = await operation();
        setIsLoading(false);
        return result;
      } catch (err) {
        setError(err);
        
        const willRetry = currentAttempt <= maxRetries;
        
        // Call onError callback if provided
        if (onError) {
          onError(err, currentAttempt, willRetry);
        }
        
        // If we've reached max retries, throw the error
        if (!willRetry) {
          setIsLoading(false);
          throw err;
        }
        
        // Wait before retrying
        const delayTime = getDelayTime(currentAttempt);
        await new Promise(resolve => setTimeout(resolve, delayTime));
        
        currentAttempt++;
      }
    }
    
    // This should never be reached due to the error throw above,
    // but TypeScript requires a return value
    setIsLoading(false);
    throw new Error('Maximum retries reached');
  }, [maxRetries, getDelayTime, onError]);

  return {
    execute,
    reset,
    isLoading,
    error,
    attempt
  };
}

export default useRetry; 