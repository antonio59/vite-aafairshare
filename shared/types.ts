/**
 * Shared Type Definitions
 * 
 * This file contains shared type definitions that are used across the application.
 * The goal is to have a single source of truth for type definitions to ensure consistency.
 */

// Firebase Auth User type (simplified version of what Firebase provides)
export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Core User type that is used throughout the application
export interface User {
  id: string;           // Firestore document ID (same as uid for auth users)
  uid: string;          // Firebase Auth UID
  email: string;        // User email
  displayName: string;  // Display name from auth provider or custom
  photoURL?: string;    // Optional profile image URL
  username?: string;    // Optional username (for backward compatibility)
  createdAt?: Date;     // When the user was created
}

// Simplified User type for UI presentation
export interface UserDisplay {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

// Conversion functions
export function convertFirebaseAuthToUser(firebaseUser: FirebaseAuthUser): User {
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    photoURL: firebaseUser.photoURL || undefined
  };
}

// Convert app User to SchemaUser for shared schema compatibility
export function convertToSchemaUser(user: User): { id: string; username: string; email: string; photoURL?: string } {
  return {
    id: user.id,
    username: user.username || user.displayName || 'Unknown User',
    email: user.email,
    photoURL: user.photoURL
  };
}

// SplitType enum to ensure consistent usage
export enum SplitType {
  EQUAL = "50/50",
  OWNED = "100%"
}

// Expense split type with proper typing
export type ExpenseSplitType = typeof SplitType[keyof typeof SplitType]; 