import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  User, 
  Expense, 
  Category, 
  Location, 
  ExpenseWithDetails,
} from '@shared/types';
import { useAuth } from './AuthContext';
import { toUUID, toISODateString } from '@shared/utils/typeGuards';
import { createExpense, updateExpense as updateExpenseService, deleteExpense as deleteExpenseService } from '@/services/expenses.service';

interface ExpenseContextType {
  expenses: ExpenseWithDetails[];
  loading: boolean;
  error: Error | null;
  fetchExpenses: (month: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();

  const convertToExpenseWithDetails = async (expense: Expense): Promise<ExpenseWithDetails> => {
    // Fetch related data
    const categoryDoc = await getDoc(doc(db, 'categories', expense.categoryId));
    const locationDoc = await getDoc(doc(db, 'locations', expense.locationId));
    const userDoc = await getDoc(doc(db, 'users', expense.paidById));

    if (!categoryDoc.exists() || !locationDoc.exists() || !userDoc.exists()) {
      throw new Error('Required related data not found');
    }

    const category = categoryDoc.data() as Category;
    const location = locationDoc.data() as Location;
    const userData = userDoc.data();

    const paidBy: User = {
      id: toUUID(userDoc.id),
      uid: userDoc.id,
      email: userData?.email || '',
      username: userData?.username || userData?.email?.split('@')[0] || 'Unknown',
      photoURL: userData?.photoURL || null,
      createdAt: userData?.createdAt ? toISODateString(new Date(userData.createdAt.seconds * 1000)) : toISODateString(new Date()),
      updatedAt: toISODateString(new Date()),
      isAnonymous: userData?.isAnonymous || false,
    };

    return {
      ...expense,
      category: {
        id: categoryDoc.id,
        name: category.name,
        icon: category.icon,
        createdAt: category.createdAt
      },
      location: {
        id: locationDoc.id,
        name: location.name,
        createdAt: location.createdAt
      },
      paidBy
    };
  };

  const fetchExpenses = useCallback(async (month: string) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const expensesRef = collection(db, 'expenses');
      const q = query(expensesRef, where('month', '==', month));
      const querySnapshot = await getDocs(q);

      const expensePromises = querySnapshot.docs.map(async (doc) => {
        const expenseData = doc.data() as Expense;
        return await convertToExpenseWithDetails({
          ...expenseData,
          id: doc.id
        } as Expense);
      });

      const expensesWithDetails = await Promise.all(expensePromises);
      setExpenses(expensesWithDetails);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch expenses'));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const addExpense = useCallback(async (expense: Expense) => {
    await createExpense(expense);
  }, []);

  const updateExpense = useCallback(async (id: string, expense: Partial<Expense>) => {
    await updateExpenseService(id, expense);
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await deleteExpenseService(id);
  }, []);

  const value = useMemo(() => ({
    expenses,
    loading,
    error,
    fetchExpenses: (month: string) => fetchExpenses(month),
    addExpense,
    updateExpense,
    deleteExpense
  }), [expenses, loading, error, fetchExpenses, addExpense, updateExpense, deleteExpense]);

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}