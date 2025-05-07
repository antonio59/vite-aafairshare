/**
 * Offline Service
 * 
 * This service provides offline capabilities for the application
 * by tracking network status and managing offline operations.
 */

import { queryClient } from '@/lib/queryClient';

// Offline queue for pending operations
interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data?: unknown;
  timestamp: number;
}

// Queue storage key
const OFFLINE_QUEUE_KEY = 'fairshare_offline_queue';

// Network status
let isOnline = navigator.onLine;

/**
 * Initialize the offline service
 * Sets up event listeners for online/offline events
 */
export function initOfflineSupport(): void {
  // Set up network status listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Load any pending operations from storage
  loadOfflineQueue();
  
  // Process queue if we're online
  if (isOnline) {
    processPendingOperations();
  }
}

/**
 * Clean up the offline service
 */
export function cleanupOfflineSupport(): void {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
}

/**
 * Handler for when the device goes online
 */
function handleOnline(): void {
  console.log('Device is online');
  isOnline = true;
  
  // Process any pending operations
  processPendingOperations();
  
  // Notify the UI that we're back online
  dispatchNetworkStatusEvent(true);
}

/**
 * Handler for when the device goes offline
 */
function handleOffline(): void {
  console.log('Device is offline');
  isOnline = false;
  
  // Notify the UI that we're offline
  dispatchNetworkStatusEvent(false);
}

/**
 * Dispatch a custom event with the network status
 */
function dispatchNetworkStatusEvent(online: boolean): void {
  const event = new CustomEvent('networkStatusChange', { 
    detail: { online } 
  });
  window.dispatchEvent(event);
}

/**
 * Check if the device is currently online
 */
export function isNetworkOnline(): boolean {
  return isOnline;
}

/**
 * Get the current offline queue
 */
export function getOfflineQueue(): OfflineOperation[] {
  try {
    const queueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
}

/**
 * Add an operation to the offline queue
 */
export function queueOfflineOperation(
  type: 'create' | 'update' | 'delete',
  collection: string,
  docId: string | undefined,
  data?: unknown
): string {
  const queue = getOfflineQueue();
  
  // Generate a unique operation ID
  const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create the operation
  const operation: OfflineOperation = {
    id: operationId,
    type,
    collection,
    docId,
    data,
    timestamp: Date.now()
  };
  
  // Add to queue and save
  queue.push(operation);
  saveOfflineQueue(queue);
  
  return operationId;
}

/**
 * Save the offline queue to localStorage
 */
function saveOfflineQueue(queue: OfflineOperation[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to save offline queue:', error);
  }
}

/**
 * Load the offline queue from localStorage
 */
function loadOfflineQueue(): OfflineOperation[] {
  return getOfflineQueue();
}

/**
 * Process pending operations when back online
 */
async function processPendingOperations(): Promise<void> {
  if (!isOnline) return;
  
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  
  console.log(`Processing ${queue.length} pending offline operations`);
  
  // Sort by timestamp (oldest first)
  const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);
  
  // Process each operation
  const failedOperations: OfflineOperation[] = [];
  
  for (const operation of sortedQueue) {
    try {
      await processOperation(operation);
      console.log(`Processed offline operation: ${operation.id}`);
    } catch (error) {
      console.error(`Failed to process offline operation ${operation.id}:`, error);
      failedOperations.push(operation);
    }
  }
  
  // Save any failed operations back to the queue
  saveOfflineQueue(failedOperations);
  
  // Refresh affected collections
  const affectedCollections = new Set(sortedQueue.map(op => op.collection));
  affectedCollections.forEach(collection => {
    queryClient.invalidateQueries({ queryKey: ['collection', collection] });
  });
}

/**
 * Process a single operation
 */
async function processOperation(operation: OfflineOperation): Promise<void> {
  // This would connect to your Supabase service
  // For example:
  
  switch (operation.type) {
    case 'create':
      // await createDocument(operation.collection, operation.data);
      console.log(`Would create document in ${operation.collection}`);
      break;
      
    case 'update':
      if (!operation.docId) throw new Error('Document ID is required for update operations');
      // await updateDocument(operation.collection, operation.docId, operation.data);
      console.log(`Would update document ${operation.docId} in ${operation.collection}`);
      break;
      
    case 'delete':
      if (!operation.docId) throw new Error('Document ID is required for delete operations');
      // await deleteDocument(operation.collection, operation.docId);
      console.log(`Would delete document ${operation.docId} from ${operation.collection}`);
      break;
      
    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }
}

/**
 * Create a document with offline support
 * If offline, the operation will be queued and executed when back online
 */
export async function createDocumentWithOfflineSupport<T>(
  collection: string,
  data: T
): Promise<string> {
  if (isOnline) {
    // Perform the operation immediately
    // const docRef = await createDocument(collection, data);
    // return docRef.id;
    console.log(`Would create document in ${collection} immediately`);
    return 'fake-doc-id';
  } else {
    // Queue the operation for later
    const operationId = queueOfflineOperation('create', collection, undefined, data);
    console.log(`Queued create operation ${operationId} for later`);
    return `local-${operationId}`;
  }
}

/**
 * Update a document with offline support
 * If offline, the operation will be queued and executed when back online
 */
export async function updateDocumentWithOfflineSupport<T>(
  collection: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  if (isOnline) {
    // Perform the operation immediately
    // await updateDocument(collection, docId, data);
    console.log(`Would update document ${docId} in ${collection} immediately`);
  } else {
    // Queue the operation for later
    queueOfflineOperation('update', collection, docId, data);
    console.log(`Queued update operation for document ${docId} for later`);
  }
}

/**
 * Delete a document with offline support
 * If offline, the operation will be queued and executed when back online
 */
export async function deleteDocumentWithOfflineSupport(
  collection: string,
  docId: string
): Promise<void> {
  if (isOnline) {
    // Perform the operation immediately
    // await deleteDocument(collection, docId);
    console.log(`Would delete document ${docId} from ${collection} immediately`);
  } else {
    // Queue the operation for later
    queueOfflineOperation('delete', collection, docId);
    console.log(`Queued delete operation for document ${docId} for later`);
  }
}

/**
 * Hook into custom network status events
 * @param callback Function to call when network status changes
 */
export function onNetworkStatusChange(
  callback: (_online: boolean) => void
): () => void {
  const handleNetworkStatusChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ online: boolean }>;
    callback(customEvent.detail.online);
  };
  
  window.addEventListener(
    'networkStatusChange', 
    handleNetworkStatusChange as EventListener
  );
  
  // Return cleanup function
  return () => {
    window.removeEventListener(
      'networkStatusChange', 
      handleNetworkStatusChange as EventListener
    );
  };
} 