/**
 * Cache Service
 * 
 * This service provides caching strategies for frequently accessed data
 * to improve performance and enable offline capabilities.
 */

import { 
  QueryClient, 
  DehydratedState, 
  dehydrate, 
  hydrate 
} from '@tanstack/react-query';
import { getDocument, getDocuments } from './firestore.service';

// Cache constants
const CACHE_PREFIX = 'fairshare_cache_';
const CACHE_EXPIRY = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const CACHE_VERSION = 1;

// Global query client for the application
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configure default stale time for all queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 1,
    },
  },
});

/**
 * Initialize the cache service
 * Restores persisted queries from localStorage
 */
export function initCache(): void {
  try {
    const persistedState = loadPersistedQueries();
    if (persistedState) {
      hydrate(queryClient, persistedState);
      console.log('Cache hydrated from localStorage');
    }
  } catch (error) {
    console.error('Failed to initialize cache:', error);
    // Clear corrupted cache
    clearCachedData();
  }
}

/**
 * Persists the current query cache to localStorage
 */
export function persistQueryCache(): void {
  try {
    const state = dehydrate(queryClient);
    localStorage.setItem(
      `${CACHE_PREFIX}dehydrated_state_v${CACHE_VERSION}`,
      JSON.stringify({
        timestamp: Date.now(),
        state,
      })
    );
  } catch (error) {
    console.error('Failed to persist query cache:', error);
  }
}

/**
 * Loads persisted queries from localStorage if not expired
 */
function loadPersistedQueries(): DehydratedState | null {
  try {
    const cachedData = localStorage.getItem(
      `${CACHE_PREFIX}dehydrated_state_v${CACHE_VERSION}`
    );
    
    if (!cachedData) return null;
    
    const { timestamp, state } = JSON.parse(cachedData);
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      console.log('Cache expired, clearing...');
      localStorage.removeItem(`${CACHE_PREFIX}dehydrated_state_v${CACHE_VERSION}`);
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load persisted queries:', error);
    return null;
  }
}

/**
 * Clears all cached data
 */
export function clearCachedData(): void {
  // Clear react-query cache
  queryClient.clear();
  
  // Clear localStorage cache
  Object.keys(localStorage)
    .filter(key => key.startsWith(CACHE_PREFIX))
    .forEach(key => localStorage.removeItem(key));
    
  console.log('Cache cleared');
}

/**
 * Prefetches a document by ID and adds it to the cache
 * 
 * @param collectionName - The name of the collection
 * @param docId - The ID of the document to prefetch
 */
export async function prefetchDocument<T>(
  collectionName: string,
  docId: string
): Promise<void> {
  const queryKey = ['document', collectionName, docId];
  
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => getDocument<T>(collectionName, docId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Prefetches a collection and adds it to the cache
 * 
 * @param collectionName - The name of the collection
 * @param queryParams - Optional parameters for the query
 */
export async function prefetchCollection<T>(
  collectionName: string,
  queryParams?: any
): Promise<void> {
  const queryKey = ['collection', collectionName, queryParams];
  
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => getDocuments<T>(collectionName, queryParams?.constraints || []),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Invalidates a document in the cache, forcing a refetch
 * 
 * @param collectionName - The name of the collection
 * @param docId - The ID of the document to invalidate
 */
export function invalidateDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ['document', collectionName, docId],
  });
}

/**
 * Invalidates a collection in the cache, forcing a refetch
 * 
 * @param collectionName - The name of the collection
 */
export function invalidateCollection(
  collectionName: string
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ['collection', collectionName],
  });
}

/**
 * Updates a document in the cache without refetching from the server
 * Useful for optimistic updates
 * 
 * @param collectionName - The name of the collection
 * @param docId - The ID of the document to update
 * @param updateFn - Function that returns the updated document
 */
export function updateCachedDocument<T>(
  collectionName: string,
  docId: string,
  updateFn: (oldData: T | undefined) => T
): void {
  queryClient.setQueryData<T>(
    ['document', collectionName, docId],
    (oldData) => updateFn(oldData)
  );
}

/**
 * Set up event listeners to persist cache when the page is unloaded
 */
export function setupCachePersistence(): void {
  window.addEventListener('beforeunload', persistQueryCache);
}

/**
 * Clean up cache persistence event listeners
 */
export function teardownCachePersistence(): void {
  window.removeEventListener('beforeunload', persistQueryCache);
}

/**
 * A helper hook factory that creates a query hook for a specific collection
 * Can be used to create custom hooks for different collections
 */
export function createCachedCollectionHook<T>(collectionName: string) {
  return (queryParams?: any) => {
    const queryKey = ['collection', collectionName, queryParams];
    
    return {
      queryKey,
      queryFn: () => getDocuments<T>(collectionName, queryParams?.constraints || []),
      // Custom options can be added here
    };
  };
} 