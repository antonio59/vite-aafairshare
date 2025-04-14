/**
 * Auth Service
 * 
 * This service provides Google authentication for this two-user application.
 */

import { 
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { User, FirebaseAuthUser, convertFirebaseAuthToUser } from '@shared/types';

/**
 * Converts a Firebase User to the app's User type
 * 
 * @param user - The Firebase User object
 * @returns The app's User object
 */
export const convertFirebaseUserToAppUser = (user: FirebaseUser): User => {
  // Use the shared conversion function
  return convertFirebaseAuthToUser({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL
  });
};

/**
 * Signs in a user with Google
 * 
 * @returns A promise that resolves when sign in is complete
 */
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

/**
 * Signs out the current user
 * 
 * @returns A promise that resolves when sign out is complete
 */
export const signOutUser = (): Promise<void> => {
  return signOut(auth);
};

/**
 * Sets up a listener for authentication state changes
 * 
 * @param callback - Function to call when auth state changes
 * @returns An unsubscribe function to remove the listener
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const appUser = convertFirebaseUserToAppUser(firebaseUser);
      callback(appUser);
    } else {
      callback(null);
    }
  });
};

/**
 * Gets the current authenticated user
 * 
 * @returns The current user or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    return convertFirebaseUserToAppUser(firebaseUser);
  }
  return null;
}; 