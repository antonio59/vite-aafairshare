/**
 * @deprecated This is a legacy version of AuthContext. Most of the app now uses AuthContext.tsx.
 * This file is kept for backward compatibility with JSX components that import from it.
 * TODO: Migrate JSX components to TypeScript and remove this file.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@shared/types';
import { AuthService } from '../services';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (_email: string, _password: string) => Promise<void>;
  signUp: (_email: string, _password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (_data: { displayName?: string; photoURL?: string }) => Promise<void>;
  allUsers?: User[];
  categories?: unknown[];
  locations?: unknown[];
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // For now, stub these out as empty arrays
  const [allUsers] = useState<User[]>([]);
  const [categories] = useState<unknown[]>([]);
  const [locations] = useState<unknown[]>([]);
  const [usersLoading] = useState(false);
  const [categoriesLoading] = useState(false);
  const [locationsLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = AuthService.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Transform the Supabase user into our User type
        const transformedUser: User = {
          id: session.user.id,
          uid: session.user.id,
          email: session.user.email || '',
          username: session.user.email?.split('@')[0] || '',
          photoURL: null,
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at || session.user.created_at,
          isAnonymous: false
        };
        
        setUser(transformedUser);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (_email: string, _password: string) => {
    const { error } = await AuthService.signIn(_email, _password);
    if (error) throw error;
  };

  const signUp = async (_email: string, _password: string) => {
    const { error } = await AuthService.signUp(_email, _password);
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await AuthService.signOut();
    if (error) throw error;
  };

  const updateProfile = async (_data: { displayName?: string; photoURL?: string }) => {
    const { error } = await AuthService.updateProfile(_data);
    if (error) throw error;
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
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