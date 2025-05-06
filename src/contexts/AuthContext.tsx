/**
 * @deprecated This is a legacy version of AuthContext. Most of the app now uses AuthContext.tsx.
 * This file is kept for backward compatibility with JSX components that import from it.
 * TODO: Migrate JSX components to TypeScript and remove this file.
 */
import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { User, FirestoreTimestamp } from '@shared/types';
import { Category, Location } from '@shared/types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { toUser, toUUID, toISODateString } from "@shared/utils/typeGuards";
import { createClient, AuthChangeEvent, Session } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
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
  
  async function signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    if (error) throw error;
    // Redirect happens automatically
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  useEffect(() => {
    // Listen for auth state changes in Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        const user = session.user;
        console.log('[AuthContext] User authenticated:', { 
          id: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || user.email?.split('@')[0]
        });
        
        // Convert Supabase user to our User type
        setCurrentUser(toUser({
          id: toUUID(user.id),
          uid: user.id,
          email: user.email || '',
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          photoURL: user.user_metadata?.avatar_url ?? null,
          createdAt: toISODateString(new Date(user.created_at)),
          updatedAt: toISODateString(new Date()),
          isAnonymous: false,
        }));
      } else {
        console.log('[AuthContext] No authenticated user');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
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
          _email: userData._email || '',
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
          id: doc.id,
          name: data.name
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