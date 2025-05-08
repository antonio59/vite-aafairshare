import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LazyMonthSelector } from "@/components/LazyMonthSelector";
import { LazySummaryCard } from "@/components/LazySummaryCard";
import { LazyExpenseTable } from "@/components/LazyExpenseTable";
import { LazyExpenseForm } from "@/components/LazyExpenseForm";
import { Button } from "@/components/ui/button";
import { PlusIcon, PoundSterling, Users, WalletCards, Download } from "lucide-react";
import { 
  ExpenseWithDetails, 
  MonthSummary, 
  User, 
  UUID, 
  ISODateString,
} from "@shared/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/NewAuthContext";
import { SupabaseService, transformSettlement, transformExpense } from '@/services/supabase.service';
import type { Tables } from '@/services/supabase.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { supabase } from '../config/supabase';

type ExportFormat = 'csv' | 'pdf';

// Helper to normalize splitType
function getSplitType(expense: ExpenseWithDetails) {
  return expense.splitType || '50/50';
}

// Helper to get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
}

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  
  // Always ensure currentMonth is valid
  useEffect(() => {
    if (!/^\d{4}-\d{2}$/.test(currentMonth)) {
      setCurrentMonth(getCurrentMonth());
    }
  }, [currentMonth]);

  const queryClient = useQueryClient();
  const handleMonthChange = useCallback((newMonth: string) => {
    console.log('Month change requested:', newMonth);
    if (newMonth !== currentMonth) {
      console.log('Updating month from', currentMonth, 'to', newMonth);
      setCurrentMonth(newMonth);
      // Clear any cached data when month changes
      queryClient.invalidateQueries({ queryKey: ['expenses', newMonth] });
      // Force a refetch of the data
      queryClient.refetchQueries({ queryKey: ['expenses', newMonth] });
    }
  }, [currentMonth, queryClient]);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | undefined>(undefined);
  const { toast } = useToast();
  // Get global data and loading states from AuthContext
  const {
    user,
    allUsers,
    loading: authLoading
  } = useAuth();
  // TODO: Replace with Supabase data fetching for categories, locations, and users
  const resourceCategories: any[] = useMemo(() => [], []);
  const resourceLocations: any[] = useMemo(() => [], []);
  const categoriesLoading = false;
  const locationsLoading = false;
  const userAllUsers: any[] = useMemo(() => allUsers || [], [allUsers]);
  const userUsersLoading = false;

  // Check data loading status but don't block rendering
  const dataIsLoading = Boolean(authLoading) || Boolean(userUsersLoading) || Boolean(categoriesLoading) || Boolean(locationsLoading);
  
  // Initialize with empty arrays instead of null when data is missing - SIMPLIFIED
  const safeUsers = useMemo(() => {
    if (!Array.isArray(userAllUsers)) {
      console.log('[Dashboard] allUsers is not an array');
      return [];
    }
    
    const users = [...userAllUsers];
    console.log('[Dashboard] Initial users from allUsers:', users.map(u => ({ id: u.id, email: u.email })));
    
    // Add current user if missing
    if (user && !users.some(u => u.id === user.uid)) {
      console.log('[Dashboard] Adding current user to safeUsers array - was missing');
      const now = new Date().toISOString() as ISODateString;
      users.push({
        id: user.uid as UUID,
        uid: user.uid,
        email: user.email || '',
        username: user.username || user.email?.split('@')[0] || 'Current User',
        photoURL: user.photoURL || null,
        createdAt: now,
        updatedAt: now,
        isAnonymous: user.isAnonymous,
      });
    } else if (user) {
      console.log('[Dashboard] Current user already exists in allUsers');
    }
    
    console.log('[Dashboard] Final safeUsers array:', users.map(u => ({ id: u.id, email: u.email })));
    return users as User[];
  }, [userAllUsers, user]);
  
  const safeCategories = useMemo(() => {
    const result = Array.isArray(resourceCategories) ? resourceCategories : [];
    console.log(`[Dashboard] safeCategories: ${result.length} items`, result.map(c => ({ id: c.id, name: c.name })));
    return result;
  }, [resourceCategories]);
  
  const safeLocations = useMemo(() => {
    const result = Array.isArray(resourceLocations) ? resourceLocations : [];
    console.log(`[Dashboard] safeLocations: ${result.length} items`, result.map(l => ({ id: l.id, name: l.name })));
    return result;
  }, [resourceLocations]);

  // Removed useState for summary - directly use calculatedSummary
  const [isCurrentMonthSettled, setIsCurrentMonthSettled] = useState(false);
  const [settlementLoading, setSettlementLoading] = useState(true);

  // Pre-define event handlers with useCallback
  const handleAddExpense = useCallback(() => { 
    setSelectedExpense(undefined); 
    setIsExpenseFormOpen(true); 
  }, []);
  
  // --- Mobile Add Expense Event Listener ---
  useEffect(() => {
    const handleMobileAdd = () => handleAddExpense();
    window.addEventListener('add-expense-event', handleMobileAdd);
    return () => window.removeEventListener('add-expense-event', handleMobileAdd);
  }, [handleAddExpense]);

  // --- Fetch Expenses using React Query - IMPROVED ---
  const fetchExpenses = useCallback(async (month: string): Promise<ExpenseWithDetails[]> => {
    if (!user) {
      console.warn("No authenticated user, returning empty expenses");
      return [];
    }
    try {
      // Fetch expenses from Supabase
      const expenses = await SupabaseService.get('expenses', { eq: { month }, order: { column: 'date', ascending: false } });
      // If error, return empty array
      if (!Array.isArray(expenses) || expenses.length === 0) return [];
      if (typeof expenses[0] === 'object' && 'error' in expenses[0]) {
        console.error('SupabaseService.get returned error:', expenses[0]);
        return [];
      }
      // Only map if the first element has an 'id' property (expense row)
      if (typeof expenses[0] === 'object' && 'id' in expenses[0]) {
        return (expenses as unknown as Tables['expenses']['Row'][]).map(exp => {
          const baseExpense = transformExpense(exp);
          return {
            ...baseExpense,
            category: { 
              id: exp.category_id ?? '', 
              name: 'Unknown Category', 
              icon: 'other', 
              createdAt: exp.created_at 
            },
            location: { 
              id: exp.location_id ?? '', 
              name: 'Unknown Location' 
            },
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
      }
      return [];
    } catch (error) {
      console.error("Error in fetchExpenses:", error);
      return [];
    }
  }, [user]);

  const {
    data: expensesData, // Rename data to avoid conflict
    isLoading: expensesLoading, // Use isLoading from useQuery
    error: expensesError,
    refetch: refetchExpenses,
  } = useQuery<ExpenseWithDetails[], Error>({
    queryKey: ['expenses', currentMonth], // Query key includes the month
    queryFn: () => fetchExpenses(currentMonth),
    // Simplified dependency - only require user authentication
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes of inactivity
    retry: 3, // Add retry logic
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Add effect to refetch data when categories or locations are loaded or updated
  useEffect(() => {
    if (safeCategories.length > 0 && safeLocations.length > 0 && !categoriesLoading && !locationsLoading) {
      console.log("[Dashboard] Categories and locations loaded, refetching expenses data");
      refetchExpenses();
    }
  }, [safeCategories, safeLocations, categoriesLoading, locationsLoading, refetchExpenses]);

  // Handle query error
  useEffect(() => {
    if (expensesError) {
      console.error("Error fetching expenses query:", expensesError);
      toast({ title: "Error", description: `Failed to load expenses: ${expensesError.message}`, variant: "destructive" });
    }
  }, [expensesError, toast]);

  // Use fetched data or default to empty array
  const expenses = useMemo(() => expensesData ?? [], [expensesData]);

  // --- Calculate Summary - OPTIMIZED ---
  // Basic user information first
  const { user1, user1Id, user1Name, user2Data, user2Id, user2Name } = useMemo(() => {
    if (!user || !safeUsers.length) {
      return { 
        user1: null, 
        user1Id: undefined, 
        user1Name: undefined, 
        user2Data: null, 
        user2Id: undefined, 
        user2Name: undefined 
      };
    }
    
    // Line 319-320: Add type annotation to parameter 'u'
    const u1 = safeUsers.find((u: User) => u.id === user.uid) || null;
    const u2 = safeUsers.find((u: User) => u.id !== user.uid) || null;
    
    return {
      user1: u1,
      user1Id: u1?.id,
      user1Name: u1?.username,
      user2Data: u2,
      user2Id: u2?.id, 
      user2Name: u2?.username
    };
  }, [user, safeUsers]);

  // Then calculate summary based on expenses
  const calculatedSummary = useMemo(() => {
    // Create a default summary object that matches MonthSummary type
    const defaultSummary: MonthSummary = {
      month: currentMonth,
      totalExpenses: 0,
      userExpenses: {},
      categoryTotals: [],
      locationTotals: [],
      splitTypeTotals: {
        "50/50": 0,
        "100%": 0
      },
      dateDistribution: {},
      settlementAmount: 0,
      settlementDirection: { fromUserId: '', toUserId: '' }
    };
    
    // Skip calculation if not ready
    if (!expenses.length || !user1Id) {
      return defaultSummary;
    }
    
    // Continue with calculation
    let totalExpenses = 0, totalSplitExpenses = 0;
    const userExpenses: Record<string, number> = { [user1Id]: 0 };
    if (user2Id) userExpenses[user2Id] = 0;
    
    let user1_paid_50_50 = 0, user1_paid_100_owed_by_other = 0, user2_paid_100_owed_by_other = 0;

    // Line 362: Add type annotation to parameter 'exp'
    expenses.forEach((exp: ExpenseWithDetails) => {
      const amount = Number(exp.amount) || 0;
      totalExpenses += amount;
      
      // Track expenses by user
      if (exp.paidBy.id === user1Id) userExpenses[user1Id] += amount;
      else if (user2Id && exp.paidBy.id === user2Id) userExpenses[user2Id] += amount;
      
      // Handle split types
      const splitType = getSplitType(exp);
      if (splitType === '50/50') { 
        totalSplitExpenses += amount; 
        if (exp.paidBy.id === user1Id) user1_paid_50_50 += amount; 
      }
      else if (splitType === '100%') { 
        if (exp.paidBy.id === user1Id) user1_paid_100_owed_by_other += amount; 
        else if (user2Id && exp.paidBy.id === user2Id) user2_paid_100_owed_by_other += amount; 
      }
    });

    const fairShare = totalSplitExpenses / 2;
    const user1Balance = user1_paid_50_50 - fairShare + user1_paid_100_owed_by_other - user2_paid_100_owed_by_other;
    const settlementAmount = Math.abs(user1Balance);
    let settlementDirection = { fromUserId: "", toUserId: "" };

    if (user2Id) {
      if (user1Balance < 0) settlementDirection = { fromUserId: user1Id, toUserId: user2Id };
      else if (user1Balance > 0) settlementDirection = { fromUserId: user2Id, toUserId: user1Id };
    }

    return {
      month: currentMonth,
      totalExpenses,
      userExpenses,
      settlementAmount,
      settlementDirection,
      categoryTotals: [],
      locationTotals: [],
      splitTypeTotals: {
        "50/50": user1_paid_50_50,
        "100%": user1_paid_100_owed_by_other + user2_paid_100_owed_by_other
      },
      dateDistribution: {}
    } as MonthSummary;
  }, [expenses, user1Id, user2Id, currentMonth]);

  // --- Fetch Settlement Status - SUPABASE VERSION ---
  useEffect(() => {
    setSettlementLoading(true);
    async function fetchSettlementStatus() {
      try {
        const settlements = await SupabaseService.get('settlements', { eq: { month: currentMonth, status: 'COMPLETED' } });
        const completedSettlements = Array.isArray(settlements)
          ? settlements.filter(row => typeof row === 'object' && row !== null && !('error' in row)).map(transformSettlement)
          : [];
        const isSettled = completedSettlements.length > 0;
        setIsCurrentMonthSettled(isSettled);
        setSettlementLoading(false);
      } catch (error) {
        console.error('Error fetching settlement status:', error);
        setIsCurrentMonthSettled(false);
        setSettlementLoading(false);
      }
    }
    fetchSettlementStatus();
  }, [currentMonth]);

  const handleEditExpense = useCallback((expense: ExpenseWithDetails) => { 
    setSelectedExpense(expense); 
    setIsExpenseFormOpen(true); 
  }, []);
  
  const handleExpenseFormClose = useCallback((needsRefetch?: boolean) => {
    setIsExpenseFormOpen(false);
    if (needsRefetch) {
      refetchExpenses();
    }
  }, [refetchExpenses]);
  
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // Add a click outside handler to close the dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only add the listener if the dropdown is open
    if (!isExportMenuOpen) return;
    
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    
    // Add the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);
  
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!calculatedSummary || expensesLoading || !user) { 
      toast({ title: "Data Not Ready", description: "Please wait for data to load." }); 
      return; 
    }

    try { 
      const { exportExpenses } = await import('@/lib/exportUtils'); 
      const expenses = expensesData ?? [];
      
      exportExpenses({ 
        format, 
        month: currentMonth, 
        expenses, 
        summary: calculatedSummary, 
        allUsers: allUsers ?? []
      }); 
      
      toast({ title: "Export Successful", description: `Expenses exported as ${format.toUpperCase()}.` }); 
    } catch (error) { 
      console.error("Export failed:", error); 
      toast({ 
        title: "Export Failed", 
        description: error instanceof Error ? error.message : "An unknown error occurred.", 
        variant: "destructive" 
      }); 
    }
  }, [calculatedSummary, expensesLoading, currentMonth, expensesData, allUsers, toast, user]);
  
  const handleDeleteExpense = useCallback(async (expense: ExpenseWithDetails) => {
    try {
      await SupabaseService.delete('expenses', expense.id);
      toast({ title: "Expense deleted", description: "The expense has been removed successfully." });
      refetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({ 
        title: "Error", 
        description: "Failed to delete expense. Please try again.", 
        variant: "destructive" 
      });
    }
  }, [toast, refetchExpenses]);

  // Settlement info based on the calculated summary - SIMPLIFIED
  const { owingUserId, owingUser, balanceTitle, balanceTooltip } = useMemo(() => {
    if (!calculatedSummary) {
      return {
        owingUserId: undefined,
        owingUser: null,
        balanceTitle: "Settled",
        balanceTooltip: "The balance is settled for this month"
      };
    }
    
    const owingUserId = calculatedSummary.settlementDirection.fromUserId;
    const owedUserId = calculatedSummary.settlementDirection.toUserId;
    const owingUser = owingUserId ? safeUsers.find(u => u.id === owingUserId) : null;
    const owedUser = owedUserId ? safeUsers.find(u => u.id === owedUserId) : null;
    const owingUserName = owingUser?.username;
    const owedUserName = owedUser?.username;
    const isSettled = !calculatedSummary.settlementAmount || calculatedSummary.settlementAmount <= 0;
    const balanceTitle = isSettled ? "Settled" : "Settlement Due";
    const balanceTooltip = isSettled ? 
      "The balance is settled for this month" : 
      `${owingUserName || 'Someone'} owes ${owedUserName || 'Someone'} ${formatCurrency(calculatedSummary.settlementAmount ?? 0)}`;
      
    return {
      owingUserId,
      owingUser,
      balanceTitle,
      balanceTooltip
    };
  }, [calculatedSummary, safeUsers]);

  // Define title and description for Dialog
  const dialogTitle = selectedExpense ? "Edit Expense" : "Add New Expense";
  const dialogDescription = "Enter the expense details below. All fields marked with * are required.";

  // Add debug logs for currentUser and users when they change
  useEffect(() => {
    if (user) {
      console.log('[Dashboard] currentUser:', { 
        id: user.id, 
        uid: user.uid,
        email: user.email 
      });
    } else {
      console.log('[Dashboard] currentUser is null');
    }
    
    console.log('[Dashboard] allUsers:', allUsers ? `${allUsers.length} users found` : 'none');
  }, [user, allUsers]);
  
  // Add debug for expenses and user relationships
  useEffect(() => {
    if (expenses.length > 0) {
      // Line 602: Add type annotation to parameter 'exp'
      const uniqueUserIds = new Set(expenses.map((exp: ExpenseWithDetails) => exp.paidBy.id));
      console.log('[Dashboard] Expenses tied to user IDs:', Array.from(uniqueUserIds));
      
      // Check if all expense user IDs exist in safeUsers
      const safeUserIds = safeUsers.map((u: User) => u.id);
      const missingUserIds = Array.from(uniqueUserIds).filter((id) => !safeUserIds.includes(id as UUID));
      
      if (missingUserIds.length > 0) {
        console.warn('[Dashboard] Some expense users not found in safeUsers:', missingUserIds);
      } else {
        console.log('[Dashboard] All expense users exist in safeUsers');
      }
    }
  }, [expenses, safeUsers]);

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
    <>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-grow w-full md:w-auto">
               <LazyMonthSelector value={currentMonth} onChange={handleMonthChange} />
            </div>
            <div className="flex items-center justify-end gap-3 flex-shrink-0">
              {/* Custom dropdown implementation instead of Radix UI */}
              <div className="relative" ref={dropdownRef}>
                {/* Button with ref to help detect outside clicks */}
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full w-9 h-9"
                  onClick={() => setIsExportMenuOpen((prev: boolean) => !prev)}
                  aria-label="Export Options"
                  aria-expanded={isExportMenuOpen}
                  id="export-menu-button"
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Export Options</span>
                </Button>
              
                {/* Dropdown content */}
                {isExportMenuOpen && (
                  <div 
                    className="absolute right-0 z-10 mt-2 w-40 p-1 origin-top-right rounded-md bg-white  shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-labelledby="export-menu-button"
                    onClick={() => setIsExportMenuOpen(false)}
                  >
                    <button
                      className="w-full text-left px-4 py-2 text-sm rounded-sm hover:bg-gray-100 "
                      role="menuitem"
                      onClick={() => handleExport('csv')}
                    >
                      Export as CSV
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm rounded-sm hover:bg-gray-100 "
                      role="menuitem"
                      onClick={() => handleExport('pdf')}
                    >
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>
                
              {/* Disable Add Expense button if month is settled */}
              <Button
                onClick={handleAddExpense}
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9"
                disabled={isCurrentMonthSettled || settlementLoading} // Disable if settled or loading status
                aria-label={isCurrentMonthSettled ? "Cannot add expense to settled month" : "Add Expense"}
              >
                <PlusIcon className="h-4 w-4" />
                <VisuallyHidden>{isCurrentMonthSettled ? "Cannot add expense to settled month" : "Add Expense"}</VisuallyHidden>
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards - Confirmed grid layout */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <LazySummaryCard title="Total" value={formatCurrency(calculatedSummary?.totalExpenses || 0)} icon={PoundSterling} variant="total" isLoading={Boolean(dataIsLoading)} />
          <LazySummaryCard title={`${user1Name || 'User 1'} Paid`} value={formatCurrency(user1Id ? calculatedSummary?.userExpenses?.[user1Id] || 0 : 0)} icon={Users} variant="user1" isLoading={Boolean(dataIsLoading)} tooltip={user1Name ? `Amount paid by ${user1Name}` : 'Amount paid by User 1'} photoURL={user1?.photoURL || undefined} username={user1Name} />
          <LazySummaryCard title={`${user2Name || 'User 2'} Paid`} value={formatCurrency(user2Id ? calculatedSummary?.userExpenses?.[user2Id] || 0 : 0)} icon={Users} variant="user2" isLoading={Boolean(dataIsLoading)} tooltip={user2Name ? `Amount paid by ${user2Name}` : 'Amount paid by User 2'} photoURL={user2Data?.photoURL || undefined} username={user2Name} />
          <LazySummaryCard title={balanceTitle} value={formatCurrency(Math.ceil((calculatedSummary?.settlementAmount ?? 0) * 100) / 100)} icon={WalletCards} variant="balance" isNegative={Boolean(owingUserId === user1Id)} isLoading={Boolean(dataIsLoading)} tooltip={balanceTooltip} photoURL={owingUser?.photoURL || undefined} username={owingUser?.username} />
        </div>

        {/* Expenses Section */}
        <div>
           <h2 className="text-xl font-semibold mb-4">Expenses</h2>
           {/* Pass expenses from useQuery result */}
           <LazyExpenseTable
             expenses={expenses}
             onEdit={handleEditExpense}
             onDelete={handleDeleteExpense}
             isLoading={Boolean(expensesLoading || dataIsLoading)} 
             isMonthSettled={Boolean(isCurrentMonthSettled)} 
           />
        </div>
      </div>

      {/* Standard Dialog for Expense Form */}
      <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
        <DialogContent className="sm:max-w-[600px] w-[90vw] max-w-[90vw] rounded-lg p-0 border-gray-200"> {/* Remove padding from content */}
           {/* Add DialogHeader, Title, and Description for Accessibility */}
           <DialogHeader> {/* Removed padding */}
             <DialogTitle>
               <VisuallyHidden>{dialogTitle}</VisuallyHidden> {/* Hide visually */}
             </DialogTitle>
             <DialogDescription>
               <VisuallyHidden>{dialogDescription}</VisuallyHidden> {/* Hide visually */}
             </DialogDescription>
           </DialogHeader>
           {/* Scrollable container for the form */}
          {/* Form container - remove padding here as it's in ExpenseForm */}
          <div className="max-h-[70vh] overflow-y-auto">
            <LazyExpenseForm
              expense={selectedExpense}
              onClose={handleExpenseFormClose} // Pass close handler
              categories={safeCategories}
              locations={safeLocations} // Re-add locations prop
              users={safeUsers}
              isLoading={Boolean(categoriesLoading || locationsLoading || userUsersLoading)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add floating action button for Add Expense on mobile */}
      <div className="fixed bottom-5 right-5 z-50 md:hidden">
        <Button
          onClick={handleAddExpense}
          className="rounded-full h-16 w-16 shadow-lg bg-primary text-white flex items-center justify-center text-3xl"
          aria-label="Add Expense"
          disabled={isCurrentMonthSettled || settlementLoading}
        >
          <PlusIcon className="h-8 w-8" />
        </Button>
      </div>
    </>
  );
}
