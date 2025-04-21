/**
 * Auth Service
 * 
 * This service provides Google authentication for this two-user application.
 */

import { 
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { User } from '@shared/types';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { toUser, toUUID, toISODateString } from '@shared/utils/typeGuards';

/**
 * Converts a Firebase User to the app's User type
 * 
 * @param firebaseUser - The Firebase User object
 * @returns The app's User object
 */
export const convertFirebaseUserToAppUser = (firebaseUser: FirebaseUser): User => {
  return toUser({
    id: toUUID(firebaseUser.uid),
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    username: firebaseUser.email?.split('@')[0] || 'Unknown User',
    photoURL: firebaseUser.photoURL ?? null,
    createdAt: toISODateString(new Date()),
    updatedAt: toISODateString(new Date()),
    isAnonymous: firebaseUser.isAnonymous,
  })!;
};

/**
 * Sign in with Google - Only allows existing users
 * Throws an error if user is not authorized
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create or update user document
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData = convertFirebaseUserToAppUser(user);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        ...userData,
        createdAt: Timestamp.fromDate(new Date())
      });
    }
    
    return userData;
  } catch (error) {
    console.error('Google sign in failed:', error);
    throw error;
  }
};

/**
 * Sign out
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Sets up a listener for authentication state changes
 * 
 * @param callback - Function to call when auth state changes
 * @returns An unsubscribe function to remove the listener
 */
export const onAuthStateChange = (
    callback: (_user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, (async (firebaseUser) => {
    if (firebaseUser) {
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await signOut(auth); // Sign out unauthorized user
        callback(null);
        return;
      }

      const userData = userSnap.data();
      // Construct a valid User object for the callback
      callback({
        ...userData,
        id: toUUID(userSnap.id),
        uid: userSnap.id,
        email: userData.email || '',
        username: userData.username || userData.email?.split('@')[0] || 'Unknown',
        photoURL: userData.photoURL ?? null,
        createdAt: toISODateString(userData.createdAt),
        updatedAt: toISODateString(userData.updatedAt ?? new Date()),
        isAnonymous: userData.isAnonymous ?? false,
      });
    } else {
      callback(null);
    }
  }) as Parameters<typeof onAuthStateChanged>[1]);
};

/**
 * Gets the current authenticated user
 * 
 * @returns The current user or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;

  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await signOut(auth);
    return null;
  }

  const userData = userSnap.data();
  return toUser({
    ...userData,
    id: toUUID(userSnap.id),
    uid: userSnap.id,
    email: userData.email || '',
    username: userData.username || userData.email?.split('@')[0] || 'Unknown',
    photoURL: userData.photoURL ?? null,
    createdAt: toISODateString(userData.createdAt),
    updatedAt: toISODateString(userData.updatedAt ?? new Date()),
    isAnonymous: userData.isAnonymous ?? false,
  });
}; 