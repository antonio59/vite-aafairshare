import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  DocumentData,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { User, SplitType, ExpenseSplitType } from '@shared/types';
import { ExpenseWithDetails, Category, Location } from '@shared/schema';

// Define a local Expense interface based on schema
interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  locationId: string;
  splitType: ExpenseSplitType;
  date: Date;
  description?: string;
  paidByUserId: string;
  month: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Add pagination parameters to the context
interface ExpenseContextType {
  expenses: ExpenseWithDetails[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  addExpense: (expenseData: Partial<Expense>) => Promise<string>;
  updateExpense: (expenseId: string, updatedData: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  fetchExpenses: (forceRefresh?: boolean) => Promise<void>;
  loadMoreExpenses: () => Promise<void>;
  filterByMonth: (month: string | null) => void;
  currentMonth: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<any>;
}

// Create a type for raw expense data from Firestore
interface FirestoreExpense {
  id: string;
  userId?: string;
  paidByUserId: string;
  categoryId: string;
  locationId: string;
  description?: string;
  amount: number;
  date: any; // Will be converted to Date
  splitType: string;
  month: string;
  category?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
  paidBy?: {
    id: string;
    uid: string;
    displayName: string;
    email: string;
  };
  [key: string]: any; // Allow other properties
}

// Cache for category and location data to reduce duplicate fetches
const categoryCache = new Map<string, Category>();
const locationCache = new Map<string, Location>();

// Constants for pagination
const PAGE_SIZE = 20;

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function useExpenses(): ExpenseContextType {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string | null>(null);
  const { currentUser } = useAuth() as AuthContextType;

  // Filter expenses by month - memoized for performance
  const filterByMonth = useCallback((month: string | null) => {
    setCurrentMonth(month);
    setExpenses([]);
    setLastDoc(null);
    setHasMore(true);
    setLoading(true);
  }, []);

  // Reset and refresh expenses when user changes
  useEffect(() => {
    if (currentUser) {
      setExpenses([]);
      setLastDoc(null);
      setHasMore(true);
      fetchExpenses(true);
    } else {
      setExpenses([]);
      setLoading(false);
      setHasMore(false);
    }
  }, [currentUser]);

  // Memoized function to convert Firestore date to JavaScript Date
  const convertFirestoreDate = useCallback((firestoreDate: any): Date => {
    if (firestoreDate && typeof firestoreDate.toDate === 'function') {
      return firestoreDate.toDate();
    } else if (firestoreDate && firestoreDate.seconds) {
      return new Date(firestoreDate.seconds * 1000);
    } else if (typeof firestoreDate === 'string') {
      return new Date(firestoreDate);
    } else {
      return new Date();
    }
  }, []);

  // Memoized function to create a category object from Firestore data
  const createCategoryFromData = useCallback((data: DocumentData | { id: string; name: string }): Category => {
    return {
      id: typeof data.id === 'string' ? data.id : 'unknown',
      name: typeof data.name === 'string' ? data.name : 'Unknown Category'
    } as Category;
  }, []);

  // Memoized function to create a location object from Firestore data
  const createLocationFromData = useCallback((data: DocumentData | { id: string; name: string }): Location => {
    return {
      id: typeof data.id === 'string' ? data.id : 'unknown',
      name: typeof data.name === 'string' ? data.name : 'Unknown Location'
    } as Location;
  }, []);

  // Fetch a single category by ID with caching
  const fetchCategory = useCallback(async (categoryId: string): Promise<Category> => {
    // Check cache first
    if (categoryCache.has(categoryId)) {
      return categoryCache.get(categoryId)!;
    }

    try {
      const categoryDoc = await getDocs(
        query(collection(db, 'categories'), where('id', '==', categoryId))
      );
      
      if (!categoryDoc.empty) {
        const category = createCategoryFromData(categoryDoc.docs[0].data());
        // Store in cache
        categoryCache.set(categoryId, category);
        return category;
      }
    } catch (err) {
      console.error(`Error fetching category ${categoryId}:`, err);
    }
    
    // Default fallback
    const defaultCategory = { id: categoryId, name: 'Unknown Category' } as Category;
    categoryCache.set(categoryId, defaultCategory);
    return defaultCategory;
  }, [createCategoryFromData]);

  // Fetch a single location by ID with caching
  const fetchLocation = useCallback(async (locationId: string): Promise<Location> => {
    // Check cache first
    if (locationCache.has(locationId)) {
      return locationCache.get(locationId)!;
    }
    
    try {
      const locationDoc = await getDocs(
        query(collection(db, 'locations'), where('id', '==', locationId))
      );
      
      if (!locationDoc.empty) {
        const location = createLocationFromData(locationDoc.docs[0].data());
        // Store in cache
        locationCache.set(locationId, location);
        return location;
      }
    } catch (err) {
      console.error(`Error fetching location ${locationId}:`, err);
    }
    
    // Default fallback
    const defaultLocation = { id: locationId, name: 'Unknown Location' } as Location;
    locationCache.set(locationId, defaultLocation);
    return defaultLocation;
  }, [createLocationFromData]);

  // Process a single expense document with proper error handling
  const processExpenseDoc = useCallback(async (expense: FirestoreExpense): Promise<ExpenseWithDetails> => {
    try {
      // Convert date to proper Date object
      const date = convertFirestoreDate(expense.date);

      // Check if this expense already has the full objects
      if (expense.category?.name && expense.location?.name && expense.paidBy?.displayName) {
        return {
          ...expense,
          date: date
        } as ExpenseWithDetails;
      }
      
      // Fetch category and location in parallel for better performance
      const [category, location] = await Promise.all([
        fetchCategory(expense.categoryId),
        fetchLocation(expense.locationId)
      ]);
      
      // Create user object
      const paidBy = { 
        id: expense.paidByUserId,
        username: expense.paidByUserId === currentUser?.uid ? 
          (currentUser?.displayName || 'You') : 'Other User',
        email: expense.paidByUserId === currentUser?.uid ? 
          (currentUser?.email || null) : null,
        photoURL: expense.paidByUserId === currentUser?.uid ? 
          currentUser?.photoURL : undefined
      };
      
      // Create a properly structured ExpenseWithDetails
      return {
        id: expense.id,
        amount: expense.amount,
        description: expense.description || "",
        date: date,
        paidByUserId: expense.paidByUserId,
        splitType: expense.splitType,
        categoryId: expense.categoryId,
        locationId: expense.locationId,
        month: expense.month,
        category,
        location,
        paidByUser: paidBy
      };
    } catch (err) {
      console.error('Error processing expense:', err);
      // Create a minimal valid object to avoid type errors
      return {
        id: expense.id,
        amount: expense.amount || 0,
        categoryId: expense.categoryId || 'unknown',
        locationId: expense.locationId || 'unknown',
        splitType: expense.splitType || SplitType.EQUAL,
        date: new Date(),
        paidByUserId: expense.paidByUserId || currentUser?.uid || 'unknown',
        month: expense.month || new Date().toISOString().slice(0, 7),
        category: { id: 'unknown', name: 'Unknown Category' } as Category,
        location: { id: 'unknown', name: 'Unknown Location' } as Location,
        paidByUser: { id: 'unknown', username: 'Unknown User', email: 'unknown@example.com' }
      } as ExpenseWithDetails;
    }
  }, [currentUser, convertFirestoreDate, fetchCategory, fetchLocation]);

  // Optimized fetch expenses with pagination
  const fetchExpenses = useCallback(async (forceRefresh = false) => {
    try {
      if (!currentUser) return;
      
      if (forceRefresh) {
        setExpenses([]);
        setLastDoc(null);
        setHasMore(true);
      }
      
      setLoading(true);
      console.log('Fetching expenses for user:', currentUser.uid);
      
      // Build the query with proper filters
      const expensesRef = collection(db, 'expenses');
      
      let expensesQuery = query(
        expensesRef,
        orderBy('date', 'desc'),
        limit(PAGE_SIZE)
      );
      
      // Add month filter if specified
      if (currentMonth) {
        expensesQuery = query(
          expensesRef,
          where('month', '==', currentMonth),
          orderBy('date', 'desc'),
          limit(PAGE_SIZE)
        );
      }
      
      // Add pagination if we have a last document
      if (lastDoc && !forceRefresh) {
        expensesQuery = currentMonth 
          ? query(
              expensesRef,
              where('month', '==', currentMonth),
              orderBy('date', 'desc'),
              startAfter(lastDoc),
              limit(PAGE_SIZE)
            )
          : query(
              expensesRef,
              orderBy('date', 'desc'),
              startAfter(lastDoc),
              limit(PAGE_SIZE)
            );
      }
      
      const querySnapshot = await getDocs(expensesQuery);
      console.log('Fetched expenses count:', querySnapshot.docs.length);
      
      // Update pagination state
      if (querySnapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      if (querySnapshot.empty) {
        setExpenses(forceRefresh ? [] : expenses);
        setLoading(false);
        return;
      }
      
      // Process expense documents
      const allExpensesList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure required fields exist with defaults if needed
          amount: Number(data.amount || 0),
          categoryId: data.categoryId || 'unknown',
          locationId: data.locationId || 'unknown',
          paidByUserId: data.paidByUserId || currentUser.uid,
          splitType: data.splitType || SplitType.EQUAL,
          month: data.month || new Date().toISOString().slice(0, 7) // YYYY-MM
        } as FirestoreExpense;
      });
      
      // Filter expenses related to the current user
      const filteredExpenses = allExpensesList.filter(exp => {
        return exp.userId === currentUser.uid || 
               exp.paidByUserId === currentUser.uid;
      });
      
      // Process all expenses in parallel for better performance
      const processedExpenses = await Promise.all(
        filteredExpenses.map(expense => processExpenseDoc(expense))
      );
      
      // Update state with new expenses (append or replace)
      setExpenses(prevExpenses => 
        forceRefresh ? processedExpenses : [...prevExpenses, ...processedExpenses]
      );
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  }, [currentUser, lastDoc, expenses, currentMonth, processExpenseDoc]);

  // Function to load more expenses
  const loadMoreExpenses = useCallback(async () => {
    if (!hasMore || loading || loadingMore) return;
    
    try {
      setLoadingMore(true);
      await fetchExpenses();
    } finally {
      setLoadingMore(false);
    }
  }, [fetchExpenses, hasMore, loading, loadingMore]);

  // Add expense function with optimized state update
  const addExpense = useCallback(async (expenseData: Partial<Expense>): Promise<string> => {
    try {
      if (!currentUser) throw new Error('User not authenticated');

      const expensesRef = collection(db, 'expenses');
      
      // Ensure splitType is one of the allowed values
      let splitTypeValue: ExpenseSplitType = SplitType.EQUAL;
      if (expenseData.splitType === SplitType.EQUAL || expenseData.splitType === SplitType.OWNED) {
        splitTypeValue = expenseData.splitType;
      }
      
      const newExpense = {
        ...expenseData,
        userId: currentUser.uid,
        // Use the date from the form if provided, otherwise use current date
        date: expenseData.date || new Date(),
        // Ensure splitType is a valid value
        splitType: splitTypeValue
      };
      
      const docRef = await addDoc(expensesRef, newExpense);
      
      // Process the new expense with related data
      const firestoreExpense = {
        id: docRef.id,
        ...newExpense,
        paidByUserId: newExpense.paidByUserId || currentUser.uid
      } as FirestoreExpense;
      
      const processedExpense = await processExpenseDoc(firestoreExpense);
      
      // Update state with the new expense at the beginning
      setExpenses(prevExpenses => [processedExpense, ...prevExpenses]);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }, [currentUser, processExpenseDoc]);

  // Update expense with optimized state updates
  const updateExpense = useCallback(async (expenseId: string, updatedData: Partial<Expense>): Promise<void> => {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, updatedData);
      
      // Update state with optimized approach
      setExpenses(prev => 
        prev.map(expense => {
          if (expense.id === expenseId) {
            // Create a new object with updated fields
            return { ...expense, ...updatedData };
          }
          return expense;
        })
      );
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }, []);

  // Delete expense with optimized state updates
  const deleteExpense = useCallback(async (expenseId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      
      // Filter out the deleted expense
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    expenses,
    loading,
    loadingMore,
    hasMore,
    addExpense,
    updateExpense,
    deleteExpense,
    fetchExpenses,
    loadMoreExpenses,
    filterByMonth,
    currentMonth
  }), [
    expenses, 
    loading, 
    loadingMore,
    hasMore, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    fetchExpenses,
    loadMoreExpenses,
    filterByMonth,
    currentMonth
  ]);

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}