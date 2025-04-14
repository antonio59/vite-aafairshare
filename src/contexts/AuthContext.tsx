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
import { User, convertFirebaseAuthToUser } from '@shared/types';
import { Category, Location } from '@shared/schema';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Create a Google provider instance
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<any>;
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

  function signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  
  function signInWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        // Use the shared conversion function
        const appUser = convertFirebaseAuthToUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
        
        console.log('[AuthContext] User authenticated:', { 
          id: appUser.id, 
          email: appUser.email,
          displayName: appUser.displayName
        });
        setCurrentUser(appUser);
      } else {
        console.log('[AuthContext] No authenticated user');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Add useEffect to load users from Firestore
  useEffect(() => {
    // Only load collections if a user is authenticated
    if (!currentUser) {
      setUsersLoading(false);
      setAllUsers([]);
      return;
    }
    
    console.log('[AuthContext] Loading users from Firestore');
    setUsersLoading(true);
    
    // Create a query against the users collection
    const usersCol = collection(db, "users");
    
    // Set up a listener for real-time updates
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => {
        const userData = doc.data();
        console.log(`[AuthContext] Loaded user from Firestore: ${doc.id}`);
        return { 
          id: doc.id, 
          uid: doc.id, // Ensure uid is set to match Firestore ID
          email: userData.email || '',
          displayName: userData.username || userData.displayName || '',
          photoURL: userData.photoURL,
          username: userData.username || userData.displayName || '' // Add username for consistency
        } as User;
      });
      
      console.log(`[AuthContext] Loaded ${fetchedUsers.length} users from Firestore`);
      setAllUsers(fetchedUsers);
      setUsersLoading(false);
    }, (error) => {
      console.error("[AuthContext] Error fetching users:", error);
      setUsersLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Add useEffect to load categories from Firestore
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
      const fetchedCategories = snapshot.docs.map(doc => ({ 
        id: doc.id,
        ...doc.data()
      }) as Category);
      
      console.log(`[AuthContext] Loaded ${fetchedCategories.length} categories from Firestore`);
      setCategories(fetchedCategories);
      setCategoriesLoading(false);
    }, (error) => {
      console.error("[AuthContext] Error fetching categories:", error);
      setCategoriesLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Add useEffect to load locations from Firestore
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
      const fetchedLocations = snapshot.docs.map(doc => ({ 
        id: doc.id,
        ...doc.data()
      }) as Location);
      
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