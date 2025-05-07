import { useState, useCallback, useId, useEffect, useMemo } from "react";
import MonthSelector from "@/components/MonthSelector";
import { ExpenseTable } from "@/components/ExpenseTable";
import ExpenseForm from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Category, ExpenseWithDetails, MonthSummary } from "@shared/types";
import { getCurrentMonth, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { exportExpenses } from "@/lib/exportUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SupabaseService, transformExpense } from '@/services/supabase.service';
import type { Tables } from '@/services/supabase.service';
import { supabase } from '../config/supabase';

const createEmptySummary = (month: string): MonthSummary => ({
  month: month,
  totalExpenses: 0,
  userExpenses: {},
  settlementAmount: 0,
  settlementDirection: { fromUserId: '', toUserId: '' },
  categoryTotals: [],
  locationTotals: [],
  splitTypeTotals: {
    "50/50": 0,
    "100%": 0
  },
  dateDistribution: {}
});

export default function Expenses() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  useEffect(() => {
    if (!/^d{4}-\d{2}$/.test(currentMonth)) {
      setCurrentMonth(getCurrentMonth());
    }
  }, []);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | undefined>(undefined);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  // --- Fetch Expenses from Supabase ---
  const [displayedExpenses, setDisplayedExpenses] = useState<ExpenseWithDetails[] | null>(null);
  const [isExpensesLoading, setIsExpensesLoading] = useState(true);
  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const result = await SupabaseService.get('expenses', { eq: { month: currentMonth }, order: { column: 'date', ascending: false } });
      if ('error' in result) throw result.error;
      return result;
    },
  });

  useEffect(() => {
    if (typeof expenses === 'object' && 'error' in expenses) {
      console.error('SupabaseService.get returned error:', expenses.error);
      setDisplayedExpenses([]);
      setIsExpensesLoading(false);
      return;
    }
    if (typeof expenses === 'object' && 'id' in expenses) {
      const mapped = (expenses as unknown as Tables['expenses']['Row'][]).map(exp => {
        const baseExpense = transformExpense(exp);
        return {
          ...baseExpense,
          category: { id: exp.category_id ?? '', name: 'Unknown Category', icon: 'other', createdAt: exp.created_at },
          location: { id: exp.location_id ?? '', name: 'Unknown Location' },
          paidBy: {
            id: exp.paid_by_id ?? '',
            uid: exp.paid_by_id ?? '',
            email: '',
            username: '',
            photoURL: null,
            createdAt: exp.created_at,
            updatedAt: exp.updated_at ?? exp.created_at,
            isAnonymous: false
          }
        };
      });
      setDisplayedExpenses(mapped);
    } else {
      setDisplayedExpenses([]);
    }
    setIsExpensesLoading(false);
  }, [expenses]);

  const handleMonthChange = (newMonth: string) => {
    setCurrentMonth(newMonth);
  };

  // Fetch Categories from Supabase
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const cats = await SupabaseService.get('categories', { order: { column: 'name', ascending: true } });
      if (!Array.isArray(cats) || cats.length === 0) return [];
      if (typeof cats[0] === 'object' && 'error' in cats[0]) return [];
      return (cats as unknown as Tables['categories']['Row'][]).map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color ?? '#000000',
        icon: cat.icon ?? 'default',
        createdAt: ''
      }));
    }
  });

  // Fetch Locations from Supabase
  const { data: locations = [], isLoading: locationsLoading, refetch: refetchLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const locs = await SupabaseService.get('locations', { order: { column: 'name', ascending: true } });
      if (!Array.isArray(locs) || locs.length === 0) return [];
      if (typeof locs[0] === 'object' && 'error' in locs[0]) return [];
      return (locs as unknown as Tables['locations']['Row'][]).map(loc => ({
        id: loc.id,
        name: loc.name
      }));
    }
  });

  // --- CRUD Handlers ---
  const handleAddExpense = useCallback(async () => {
    setIsExpenseFormOpen(false); // Ensure closed before opening
    toast({ title: "Loading data", description: "Preparing expense form..." });
    try {
      await Promise.all([refetchCategories(), refetchLocations()]);
      setSelectedExpense(undefined);
      setIsExpenseFormOpen(true);
    } catch (error) {
      console.error("Error preparing expense form:", error);
      toast({
        title: "Error",
        description: "Failed to load required data. Please try again.",
        variant: "destructive"
      });
    }
  }, [refetchCategories, refetchLocations, toast]);

  const handleEditExpense = useCallback(async (expense: ExpenseWithDetails) => {
    setIsExpenseFormOpen(false); // Ensure closed before opening
    toast({ title: "Loading data", description: "Preparing expense form..." });
    try {
      await Promise.all([refetchCategories(), refetchLocations()]);
      setSelectedExpense(expense);
      setIsExpenseFormOpen(true);
    } catch (error) {
      console.error("Error preparing expense form for editing:", error);
      toast({
        title: "Error",
        description: "Failed to load required data. Please try again.",
        variant: "destructive"
      });
    }
  }, [refetchCategories, refetchLocations, toast]);

  const handleDeleteExpense = useCallback(async (expense: ExpenseWithDetails) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteExpense = useCallback(async () => {
    if (!expenseToDelete) return;
    try {
      await SupabaseService.delete('expenses', expenseToDelete.id);
      toast({ title: "Expense deleted", description: "The expense has been removed successfully." });
      setExpenseToDelete(null);
      setIsDeleteDialogOpen(false);
      // Refetch expenses
      refetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive"
      });
    }
  }, [expenseToDelete, toast, refetchExpenses]);

  // --- Summary calculation using Supabase-fetched data ---
  const summary: MonthSummary = useMemo(() => {
    if (!displayedExpenses || displayedExpenses.length === 0) {
      return createEmptySummary(currentMonth);
    }

    const categoryTotals: Record<string, number> = {};
    const userExpenses: Record<string, number> = {};
    let totalExpenses = 0;

    displayedExpenses.forEach(expense => {
      totalExpenses += expense.amount;

      // Category totals
      if (!categoryTotals[expense.categoryId]) {
        categoryTotals[expense.categoryId] = 0;
      }
      categoryTotals[expense.categoryId] += expense.amount;

      // User totals
      if (!userExpenses[expense.paidById]) {
        userExpenses[expense.paidById] = 0;
      }
      userExpenses[expense.paidById] += expense.amount;
    });

    return {
      month: currentMonth,
      totalExpenses,
      userExpenses,
      settlementAmount: 0,
      settlementDirection: { fromUserId: '', toUserId: '' },
      categoryTotals: Object.entries(categoryTotals).map(([categoryId, amount]) => ({
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        category: categories.find(c => c.id === categoryId) ?? { id: categoryId, name: 'Unknown', icon: 'other', createdAt: '' }
      })),
      locationTotals: [],
      splitTypeTotals: {
        "50/50": 0,
        "100%": 0
      },
      dateDistribution: {}
    };
  }, [displayedExpenses, categories, currentMonth]);

  // --- Export Handler ---
  const handleExport = (format: 'csv' | 'pdf') => {
    if (!displayedExpenses) return;
    exportExpenses({
      format,
      month: currentMonth,
      expenses: displayedExpenses,
      summary, // use the computed summary
      allUsers: [] // You can fetch and pass users if needed
    });
    toast({ title: "Export Successful", description: `Expenses exported as ${format.toUpperCase()}.` });
  };

  useEffect(() => {
    const subscription = supabase
      .channel('expenses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        // Refetch expenses on any change
        refetchExpenses();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refetchExpenses]);

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>

        <Button
          onClick={handleAddExpense}
          className="hidden sm:flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <MonthSelector
        value={currentMonth}
        onChange={handleMonthChange}
        onExport={handleExport}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6 flex flex-col">
        <div className="px-3 py-4 sm:px-6 sm:py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-medium text-gray-800">Expenses</h3>

            <Button
              onClick={handleAddExpense}
              size="sm"
              variant="outline"
              className="sm:hidden"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto flex-1 min-h-0">
          {isExpensesLoading || displayedExpenses === null ? (
             <div className="p-6 text-center">
                <Skeleton className="h-8 w-1/2 mx-auto mb-4" />
                <Skeleton className="h-6 w-3/4 mx-auto" />
             </div>
          ) : (
            <ExpenseTable
              key={currentMonth}
              expenses={displayedExpenses}
              users={[]}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              isLoading={false}
            />
          )}
        </div>
      </div>

      <Button
        onClick={handleAddExpense}
        className="fixed bottom-20 right-4 md:bottom-8 md:right-6 h-12 w-12 rounded-full bg-primary text-white shadow-lg flex sm:hidden md:flex items-center justify-center hover:bg-blue-600 transition-colors p-0 z-10"
      >
        <PlusIcon className="h-5 w-5" />
      </Button>

      <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
        <DialogContent
          className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
          aria-labelledby={dialogTitleId}
          aria-describedby={dialogDescriptionId}
        >
          <DialogHeader>
            <DialogTitle id={dialogTitleId}>{selectedExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription id={dialogDescriptionId}>
              {selectedExpense ? "Update the details of the expense." : "Fill in the details to add a new expense."}
            </DialogDescription>
          </DialogHeader>
          {isExpenseFormOpen && !categoriesLoading && !locationsLoading && (
            <ExpenseForm
              expense={selectedExpense}
              onClose={() => {
                setIsExpenseFormOpen(false);
                setSelectedExpense(undefined);
              }}
              categories={categories || []}
              locations={locations || []}
              users={[]}
              isLoading={false}
            />
          )}
          {isExpenseFormOpen && (categoriesLoading || locationsLoading) && (
            <div className="py-6 flex justify-center">
              <div className="text-center">
                <div className="mb-4">Loading required data...</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded-full ${categoriesLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <div>Categories {categoriesLoading ? 'loading...' : `(${categories.length} loaded)`}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded-full ${locationsLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <div>Locations {locationsLoading ? 'loading...' : `(${locations.length} loaded)`}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense?
              {expenseToDelete && (
                <div className="mt-2 text-sm">
                  <p><strong>Amount:</strong> {formatCurrency(expenseToDelete.amount)}</p>
                  <p><strong>Description:</strong> {expenseToDelete.description || "No description"}</p>
                  <p><strong>Category:</strong> {expenseToDelete.category?.name || "Unknown category"}</p>
                </div>
              )}
              <p className="mt-4 text-sm font-semibold text-destructive">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
