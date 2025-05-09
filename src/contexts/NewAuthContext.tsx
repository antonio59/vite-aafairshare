import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@shared/types';
import { AuthService } from '../services';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  allUsers: User[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
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

  useEffect(() => {
    console.log('[AuthProvider] Calling AuthService.onAuthStateChange');
    const { data: authListener } = AuthService.onAuthStateChange((user: User | null) => {
      console.log('[AuthProvider] Auth state changed:', user);
      setUser(user);
      setLoading(false);
      console.log('[AuthProvider] loading set to false');
    });
    console.log('[AuthProvider] AuthService.onAuthStateChange subscription set:', authListener);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await AuthService.signInWithGoogle();
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await AuthService.signOut();
    if (error) throw error;
  };

  const value: AuthContextType = {
    user,
    currentUser: user,
    allUsers: user ? [user] : [],
    loading,
    signInWithGoogle,
    signOut,
    logout: signOut
  };

  console.log('[AuthProvider] Render: user =', user, 'loading =', loading);
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 