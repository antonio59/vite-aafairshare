/**
 * Shared Type Definitions
 * 
 * This file contains shared type definitions that are used across the application.
 * The goal is to have a single source of truth for type definitions to ensure consistency.
 */

// Constants and Utilities
export const CATEGORY_ICONS = {
  SUBSCRIPTIONS: 'Subscriptions',
  UTILITIES: 'Utilities',
  GIFTS: 'Gifts',
  HOLIDAYS: 'Holidays',
  GROCERIES: 'Groceries',
  TRANSPORT: 'Transport',
  HEALTH: 'Health',
  ENTERTAINMENT: 'Entertainment',
  DINING: 'Dining',
  SHOPPING: 'Shopping',
  OTHER: 'other'
} as const;

// Category icon type - matches Firestore data exactly
export type CategoryIconName = 
  | 'Subscriptions'
  | 'Utilities'
  | 'Gifts'
  | 'Holidays'
  | 'Groceries'
  | 'Transport'
  | 'Health'
  | 'Entertainment'
  | 'Dining'
  | 'Shopping'
  | 'other';  // Added for fallback

// Validation Types
export type PositiveNumber = number;
export type UUID = string;
export type ISODateString = string;

// Validation errors
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Utility type guards and validators
export const isPositiveNumber = (n: number): n is PositiveNumber => n > 0;
export const isUUID = (s: string): s is UUID => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export const isISODateString = (s: string): s is ISODateString => !isNaN(Date.parse(s));

// Validation functions that throw errors
export function validatePositiveNumber(n: number, fieldName: string): PositiveNumber {
  if (!isPositiveNumber(n)) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
  return n as PositiveNumber;
}

export function validateUUID(s: string, fieldName: string): UUID {
  if (!isUUID(s)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }
  return s as UUID;
}

export function validateISODateString(s: string, fieldName: string): ISODateString {
  if (!isISODateString(s)) {
    throw new ValidationError(`${fieldName} must be a valid ISO date string`);
  }
  return s as ISODateString;
}

// Expense validation function
export function validateExpense(expense: Omit<Expense, 'id'>): Omit<Expense, 'id'> {
  return {
    amount: validatePositiveNumber(expense.amount as number, 'amount'),
    description: expense.description,
    categoryId: validateUUID(expense.categoryId as string, 'categoryId'),
    locationId: validateUUID(expense.locationId as string, 'locationId'),
    paidById: validateUUID(expense.paidById as string, 'paidById'),
    splitBetweenIds: expense.splitBetweenIds.map(id => validateUUID(id as string, 'splitBetweenIds')),
    splitType: expense.splitType,
    month: expense.month,
    date: validateISODateString(expense.date as string, 'date'),
    createdAt: validateISODateString(expense.createdAt as string, 'createdAt'),
    updatedAt: validateISODateString(expense.updatedAt as string, 'updatedAt')
  };
}

// Firebase Auth User type with required Firebase properties
export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  username: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: Array<{
    providerId: string;
    uid: string;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }>;
}

// Core User type that is used throughout the application
export interface User {
  id: UUID;
  uid: UUID;
  email: string;
  username: string;
  photoURL: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  isAnonymous: boolean;
  isEmailVerified: boolean;
}

// Simplified User type for UI presentation
export interface UserDisplay {
  id: string;
  username: string;
  email: string;
  photoURL?: string;
}

// Location type for expense locations
export interface Location {
  id: UUID;
  name: string;
  color?: string;      // Optional color field
  createdAt: ISODateString | Date;
}

// Category type for expense categories
export interface Category {
  id: UUID;
  name: string;
  icon: string;
  createdAt: ISODateString | Date;
  color?: string;      // Optional color field
}

// Firestore timestamp format
export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

// SplitType enum to ensure consistent usage
export enum SplitType {
  EQUAL = "50/50",
  OWNED = "100%"
}

// Expense split type with proper typing
export type ExpenseSplitType = "50/50" | "100%";

// Base Expense type
export interface Expense {
  id: UUID;
  amount: PositiveNumber;
  description: string;
  categoryId: UUID;
  locationId: UUID;
  paidById: UUID;
  splitBetweenIds: UUID[];
  splitType: ExpenseSplitType;
  month: string; // YYYY-MM
  date: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Extended Expense type with related entity details
export interface ExpenseWithDetails extends Expense {
  category: Category;
  location: Location;
  paidBy: User;
  paidByUser?: User;
}

// Auth Context Type - Google sign-in only
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// Settlement validation function
export function validateSettlement(settlement: Omit<Settlement, 'id'>): Omit<Settlement, 'id'> {
  if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(settlement.status)) {
    throw new ValidationError('status must be one of: PENDING, COMPLETED, CANCELLED');
  }
  return {
    fromUserId: validateUUID(settlement.fromUserId as string, 'fromUserId'),
    toUserId: validateUUID(settlement.toUserId as string, 'toUserId'),
    amount: validatePositiveNumber(settlement.amount as number, 'amount'),
    status: settlement.status,
    month: settlement.month,
    date: validateISODateString(settlement.date as string, 'date'),
    createdAt: validateISODateString(settlement.createdAt as string, 'createdAt'),
    updatedAt: validateISODateString(settlement.updatedAt as string, 'updatedAt')
  };
}

// Settlement type
export interface Settlement {
  id: UUID;
  fromUserId: UUID;
  toUserId: UUID;
  amount: PositiveNumber;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  month: string; // YYYY-MM
  date: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Extended Settlement type with related data
export interface SettlementWithUsers extends Settlement {
  fromUser: User;
  toUser: User;
}

// Type for individual category/location totals
export interface AggregatedTotal {
  amount: number;
  percentage: number;
}

export interface CategoryTotal extends AggregatedTotal {
  category: Category;
}

export interface LocationTotal extends AggregatedTotal {
  location: Location;
}

// Month Summary type
export interface MonthSummary {
  month: string;
  totalExpenses: number;
  userExpenses: Record<string, number>;
  settlementAmount: number;
  settlementDirection: { fromUserId: string; toUserId: string };
  categoryTotals: CategoryTotal[];
  locationTotals: LocationTotal[];
  splitTypeTotals: Record<ExpenseSplitType, number>;
  dateDistribution: Record<string, number>;
}

// Type for trend analysis data
export interface TrendData {
  months: string[];
  totalsByMonth: number[];
  categoriesData: Record<string, number[]>;
  locationsData: Record<string, number[]>;
}

// Recurring expense frequency
export type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

// Recurring expense type
export interface RecurringExpense extends Omit<Expense, 'date'> {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: ISODateString;
  endDate?: ISODateString;
  lastProcessedDate?: ISODateString;
}

// Recurring expense with related data
export interface RecurringExpenseWithDetails extends RecurringExpense {
  category: Category;
  location: Location;
  paidByUser: User;
}

// Conversion functions
export function convertFirebaseAuthToUser(firebaseUser: FirebaseAuthUser): User {
  const now = new Date().toISOString() as ISODateString;
  return {
    id: firebaseUser.uid as UUID,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    username: firebaseUser.username || firebaseUser.email?.split('@')[0] || 'User',
    photoURL: firebaseUser.photoURL || null,
    createdAt: now,
    updatedAt: now,
    isAnonymous: firebaseUser.isAnonymous,
    isEmailVerified: firebaseUser.emailVerified
  };
}

// Convert app User to SchemaUser for shared schema compatibility
export function convertToSchemaUser(user: User): User {
  return {
    id: user.id,
    uid: user.uid,
    email: user.email,
    username: user.username || 'Unknown User',
    photoURL: user.photoURL,
    createdAt: user.createdAt as ISODateString,
    updatedAt: user.updatedAt as ISODateString,
    isAnonymous: user.isAnonymous,
    isEmailVerified: user.isEmailVerified,
  };
} 