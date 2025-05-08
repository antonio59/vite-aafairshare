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
    const { data: authListener } = AuthService.onAuthStateChange((user: User | null) => {
      setUser(user);
      setLoading(false);
    });

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

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 