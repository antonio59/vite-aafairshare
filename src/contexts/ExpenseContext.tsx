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
  _expenses: ExpenseWithDetails[];
  loading: boolean;
  error: Error | null;
  fetchExpenses: (_month: string) => Promise<void>;
  addExpense: (_expense: Expense) => Promise<void>;
  updateExpense: (_id: string, _expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (_id: string) => Promise<void>;
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
  const [_expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();

  const convertToExpenseWithDetails = async (_expense: Expense): Promise<ExpenseWithDetails> => {
    // Fetch related data
    const categoryDoc = await getDoc(doc(db, 'categories', _expense.categoryId));
    const locationDoc = await getDoc(doc(db, 'locations', _expense.locationId));
    const userDoc = await getDoc(doc(db, 'users', _expense.paidById));

    if (!categoryDoc.exists() || !locationDoc.exists() || !userDoc.exists()) {
      throw new Error('Required related data not found');
    }

    const category = categoryDoc.data() as Category;
    const location = locationDoc.data() as Location;
    const userData = userDoc.data();

    const paidBy: User = {
      id: toUUID(userDoc.id),
      uid: userDoc.id, // Add uid if required by User type
      email: userData?.email || '',
      username: userData?.username || userData?.email?.split('@')[0] || 'Unknown',
      photoURL: userData?.photoURL || null,
      createdAt: userData?.createdAt ? toISODateString(new Date(userData.createdAt.seconds * 1000)) : toISODateString(new Date()),
      updatedAt: toISODateString(new Date()),
      isAnonymous: userData?.isAnonymous || false,
    };

    return {
      ..._expense,
      category: {
        id: categoryDoc.id,
        name: category.name,
        icon: category.icon,
        createdAt: category.createdAt
      },
      location: {
        id: locationDoc.id,
        name: location.name
      },
      paidBy
    };
  };

  const fetchExpenses = useCallback(async (_month: string) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const _expensesRef = collection(db, '_expenses');
      const q = query(_expensesRef, where('_month', '==', _month));
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
      console.error('Error fetching _expenses:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch _expenses'));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const addExpense = useCallback(async (_expense: Expense) => {
    await createExpense(_expense);
  }, []);

  const updateExpense = useCallback(async (_id: string, _expense: Partial<Expense>) => {
    await updateExpenseService(_id, _expense);
  }, []);

  const deleteExpense = useCallback(async (_id: string) => {
    await deleteExpenseService(_id);
  }, []);

  const value = useMemo(() => ({
    _expenses,
    loading,
    error,
    fetchExpenses: (_month: string) => fetchExpenses(_month),
    addExpense,
    updateExpense,
    deleteExpense
  }), [_expenses, loading, error, fetchExpenses, addExpense, updateExpense, deleteExpense]);

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}