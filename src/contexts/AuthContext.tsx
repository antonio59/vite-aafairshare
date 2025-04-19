/**
 * @deprecated This is a legacy version of AuthContext. Most of the app now uses AuthContext.tsx.
 * This file is kept for backward compatibility with JSX components that import from it.
 * TODO: Migrate JSX components to TypeScript and remove this file.
 */
import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  User as FirebaseUser,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User, FirestoreTimestamp } from '@shared/types';
import { Category, Location } from '@shared/types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, Timestamp } from 'firebase/firestore';
import { toUser, toUUID, toISODateString } from "@shared/utils/typeGuards";

// Create a Google provider instance
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  allUsers?: User[];
  categories?: Category[];
  locations?: Location[];
  usersLoading?: boolean;
  categoriesLoading?: boolean;
  locationsLoading?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to convert Firestore timestamp to Date
function convertTimestamp(timestamp: Timestamp | FirestoreTimestamp | Date | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return new Date(timestamp._seconds * 1000);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add state for collections
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Add loading states
  const [usersLoading, setUsersLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);

  async function signup(email: string, password: string) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }
  
  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log('[AuthContext] User authenticated:', { 
            id: userData.id, 
            email: userData.email,
            username: userData.username
          });
          setCurrentUser(
            toUser({
              ...userData,
              id: toUUID(userSnap.id),
              createdAt: toISODateString(userData.createdAt),
              updatedAt: toISODateString(new Date()),
            })
          );
        } else {
          // Create new user document if it doesn't exist
          const newUser = toUser({
            id: toUUID(user.uid),
            uid: user.uid,
            email: user.email || '',
            username: user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL ?? null,
            createdAt: toISODateString(new Date()),
            updatedAt: toISODateString(new Date()),
            isAnonymous: user.isAnonymous,
          });
          setCurrentUser(newUser);
        }
      } else {
        console.log('[AuthContext] No authenticated user');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUsersLoading(false);
      setAllUsers([]);
      return;
    }
    
    console.log('[AuthContext] Loading users from Firestore');
    setUsersLoading(true);
    
    const usersCol = collection(db, "users");
    const usersQuery = query(usersCol, orderBy("username"));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => {
        const userData = doc.data();
        return toUser({
          ...userData,
          id: toUUID(doc.id),
          uid: doc.id,
          email: userData.email || '',
          username: userData.username || userData.displayName || '',
          photoURL: userData.photoURL ?? null,
          createdAt: toISODateString(userData.createdAt),
          updatedAt: toISODateString(userData.updatedAt ?? new Date()),
          isAnonymous: userData.isAnonymous ?? false,
        });
      }).filter(Boolean) as User[];
      
      console.log(`[AuthContext] Loaded ${fetchedUsers.length} users from Firestore`);
      setAllUsers(fetchedUsers);
      setUsersLoading(false);
    }, (error) => {
      console.error("[AuthContext] Error fetching users:", error);
      setUsersLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setCategoriesLoading(false);
      setCategories([]);
      return;
    }
    
    console.log('[AuthContext] Loading categories from Firestore');
    setCategoriesLoading(true);
    
    const categoriesCol = collection(db, "categories");
    const categoriesQuery = query(categoriesCol, orderBy("name"));
    
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data,
          id: doc.id,
          createdAt: convertTimestamp(data.createdAt)
        } as Category;
      });
      
      console.log(`[AuthContext] Loaded ${fetchedCategories.length} categories from Firestore`);
      setCategories(fetchedCategories);
      setCategoriesLoading(false);
    }, (error) => {
      console.error("[AuthContext] Error fetching categories:", error);
      setCategoriesLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLocationsLoading(false);
      setLocations([]);
      return;
    }
    
    console.log('[AuthContext] Loading locations from Firestore');
    setLocationsLoading(true);
    
    const locationsCol = collection(db, "locations");
    const locationsQuery = query(locationsCol, orderBy("name"));
    
    const unsubscribe = onSnapshot(locationsQuery, (snapshot) => {
      const fetchedLocations = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data,
          id: doc.id,
          createdAt: convertTimestamp(data.createdAt)
        } as Location;
      });
      
      console.log(`[AuthContext] Loaded ${fetchedLocations.length} locations from Firestore`);
      setLocations(fetchedLocations);
      setLocationsLoading(false);
    }, (error) => {
      console.error("[AuthContext] Error fetching locations:", error);
      setLocationsLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout,
    loading,
    allUsers,
    categories,
    locations,
    usersLoading,
    categoriesLoading,
    locationsLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}