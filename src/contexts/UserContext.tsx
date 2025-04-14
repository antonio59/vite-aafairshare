/**
 * UserContext
 * 
 * This context provides access to all users in the application.
 * It separates user management from authentication concerns.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@shared/types';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface UserContextType {
  allUsers: User[];
  usersLoading: boolean;
  refreshUsers: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUsers(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Setup users listener
  useEffect(() => {
    if (!currentUser) {
      setAllUsers([]);
      setUsersLoading(false);
      return;
    }
    
    console.log('[UserContext] Setting up users listener');
    setUsersLoading(true);
    
    const usersCol = collection(db, "users");
    const q = query(usersCol);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => {
        const userData = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          email: userData.email || '',
          displayName: userData.username || userData.displayName || '',
          photoURL: userData.photoURL,
          username: userData.username || userData.displayName || '' // Add username for backward compatibility
        } as User;
      });
      
      console.log(`[UserContext] Loaded ${fetchedUsers.length} users`);
      
      // Add current user if not already in the list
      if (currentUser && !fetchedUsers.some(u => u.id === currentUser.uid)) {
        console.log('[UserContext] Adding current user to users list');
        fetchedUsers.push({
          id: currentUser.uid,
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          photoURL: currentUser.photoURL,
          username: currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
        });
      }
      
      setAllUsers(fetchedUsers);
      setUsersLoading(false);
    }, (error) => {
      console.error('[UserContext] Error fetching users:', error);
      setUsersLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Function to manually refresh users
  const refreshUsers = () => {
    if (currentUser) {
      setUsersLoading(true);
      // The snapshot listener will automatically refresh the data
    }
  };
  
  const value: UserContextType = {
    allUsers,
    usersLoading,
    refreshUsers
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
} 