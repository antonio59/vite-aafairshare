/**
 * Firestore Service
 * 
 * This service abstracts Firestore database operations, providing
 * a clean API for components to interact with the database without
 * directly depending on Firestore implementation details.
 */

import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  QueryConstraint,
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';

/**
 * Creates a new document in a collection
 * 
 * @param collectionName - The name of the collection
 * @param data - The data to store in the document
 * @returns A promise that resolves to the document reference
 */
export const createDocument = async <T extends Record<string, any>>(
  collectionName: string, 
  data: T
): Promise<DocumentReference> => {
  const dataWithTimestamp = {
    ...data,
    createdAt: serverTimestamp()
  };
  return addDoc(collection(db, collectionName), dataWithTimestamp);
};

/**
 * Updates an existing document
 * 
 * @param collectionName - The name of the collection
 * @param docId - The ID of the document to update
 * @param data - The data to update in the document
 * @returns A promise that resolves when the update is complete
 */
export const updateDocument = async <T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  const dataWithTimestamp = {
    ...data,
    updatedAt: serverTimestamp()
  };
  const docRef = doc(db, collectionName, docId);
  return updateDoc(docRef, dataWithTimestamp);
};

/**
 * Deletes a document
 * 
 * @param collectionName - The name of the collection
 * @param docId - The ID of the document to delete
 * @returns A promise that resolves when the deletion is complete
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  const docRef = doc(db, collectionName, docId);
  return deleteDoc(docRef);
};

/**
 * Gets a document by ID
 * 
 * @param collectionName - The name of the collection
 * @param docId - The ID of the document to retrieve
 * @returns A promise that resolves to the document data or null if not found
 */
export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  
  return null;
};

/**
 * Gets all documents from a collection
 * 
 * @param collectionName - The name of the collection
 * @param constraints - Optional query constraints (where, orderBy, limit)
 * @returns A promise that resolves to an array of documents
 */
export const getDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  const collectionRef = collection(db, collectionName);
  const q = constraints.length > 0
    ? query(collectionRef, ...constraints)
    : query(collectionRef);
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
};

/**
 * Helper function to create a where constraint
 */
export const whereConstraint = where;

/**
 * Helper function to create an orderBy constraint
 */
export const orderByConstraint = orderBy;

/**
 * Helper function to create a limit constraint
 */
export const limitConstraint = firestoreLimit; 