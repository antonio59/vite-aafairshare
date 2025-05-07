import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Expense, ExpenseWithDetails } from '@shared/types';
import { useAuth } from './NewAuthContext';
import { ExpensesService } from '@/services/expenses.service';

interface ExpenseContextType {
  _expenses: ExpenseWithDetails[];
  loading: boolean;
  error: Error | null;
  fetchExpenses: (_month: string) => Promise<void>;
  addExpense: (_expense: Expense) => Promise<void>;
  updateExpense: (_id: string, _expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (_id: string) => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function useExpenses(): ExpenseContextType {
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

  const fetchExpenses = useCallback(async (_month: string) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const expenses = await ExpensesService.getExpenses();
      // Filter expenses by month if needed
      const filteredExpenses = expenses.filter(expense => expense.month === _month);
      setExpenses(filteredExpenses);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch expenses'));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const addExpense = useCallback(async (expense: Expense) => {
    if (!currentUser) return;
    
    try {
      const newExpense = await ExpensesService.createExpense(expense);
      setExpenses(prev => [...prev, newExpense as ExpenseWithDetails]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add expense'));
    }
  }, [currentUser]);

  const updateExpense = useCallback(async (id: string, expense: Partial<Expense>) => {
    if (!currentUser) return;
    
    try {
      const updatedExpense = await ExpensesService.updateExpense(id, expense);
      setExpenses(prev => prev.map(e => e.id === id ? updatedExpense as ExpenseWithDetails : e));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update expense'));
    }
  }, [currentUser]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!currentUser) return;
    
    try {
      await ExpensesService.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete expense'));
    }
  }, [currentUser]);

  const value = useMemo(() => ({
    _expenses,
    loading,
    error,
    fetchExpenses,
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