import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
  validatePositiveNumber
} from "@shared/types";
import { formatCurrency, getCurrentMonth, normalizeToDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useResources } from "@/contexts/ResourceContext";
import { useUsers } from "@/contexts/UserContext";
import { deleteExpense } from "@/services/expenses.service";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, limit } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { FirebaseError } from 'firebase/app';

type ExportFormat = 'csv' | 'pdf';

// Helper to normalize splitType
function getSplitType(expense: ExpenseWithDetails) {
  return expense.splitType || '50/50';
}

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | undefined>(undefined);
  const { toast } = useToast();
  // Get global data and loading states from AuthContext
  const {
    currentUser,
    allUsers,
    loading: authLoading
  } = useAuth();
  const { categories: resourceCategories, locations: resourceLocations, categoriesLoading, locationsLoading } = useResources();
  const { allUsers: userAllUsers, usersLoading: userUsersLoading } = useUsers();

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
    if (currentUser && !users.some(u => u.id === currentUser.uid)) {
      console.log('[Dashboard] Adding current user to safeUsers array - was missing');
      const now = new Date().toISOString() as ISODateString;
      users.push({
        id: currentUser.uid as UUID,
        uid: currentUser.uid,
        email: currentUser.email || '',
        username: currentUser.username || currentUser.email?.split('@')[0] || 'Current User',
        photoURL: currentUser.photoURL || null,
        createdAt: now,
        updatedAt: now,
        isAnonymous: currentUser.isAnonymous,
      });
    } else if (currentUser) {
      console.log('[Dashboard] Current user already exists in allUsers');
    }
    
    console.log('[Dashboard] Final safeUsers array:', users.map(u => ({ id: u.id, email: u.email })));
    return users as User[];
  }, [userAllUsers, currentUser]);
  
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
    console.log("🔥 Dashboard: Fetching expenses for month:", month);
    
    // Check if user is authenticated first
    if (!currentUser) {
      console.warn("No authenticated user, returning empty expenses");
      return [];
    }
    
    try {
      // Fetch data from Firestore directly if auth is good but users might not be loaded yet
      const expensesCol = collection(db, "expenses");
      const expensesQuery = query(expensesCol, where("month", "==", month));
      const snapshot = await getDocs(expensesQuery);
      console.log(`📊 Dashboard: Retrieved ${snapshot.docs.length} expenses for month: ${month}`);
      
      if (snapshot.empty) {
        return [];
      }

      // Check if we have enough user data
      const expenseUserIds = new Set(snapshot.docs.map(doc => doc.data().paidById));
      console.log(`Dashboard: Found ${expenseUserIds.size} unique user IDs in expenses`);
      
      // Create maps for efficient lookups with better error handling
      let categoryMap = new Map();
      let locationMap = new Map();
      let userMap = new Map();
      
      // Only create maps if data is available
      if (Array.isArray(safeCategories) && safeCategories.length > 0) {
        categoryMap = new Map(safeCategories.map(c => [c.id, c]));
        console.log(`[Dashboard] Created categoryMap with ${categoryMap.size} categories`);
        if (categoryMap.size > 0) {
          // Log a sample category from the map to confirm structure
          const sampleCatId = safeCategories[0].id;
          console.log(`[Dashboard] Sample category (${sampleCatId}):`, categoryMap.get(sampleCatId));
        }
      } else {
        console.warn(`[Dashboard] No categories available to map - safeCategories length: ${safeCategories?.length}`);
      }
      
      if (Array.isArray(safeLocations) && safeLocations.length > 0) {
        locationMap = new Map(safeLocations.map(l => [l.id, l]));
        console.log(`[Dashboard] Created locationMap with ${locationMap.size} locations`);
        if (locationMap.size > 0) {
          // Log a sample location from the map to confirm structure
          const sampleLocId = safeLocations[0].id;
          console.log(`[Dashboard] Sample location (${sampleLocId}):`, locationMap.get(sampleLocId));
        }
      } else {
        console.warn(`[Dashboard] No locations available to map - safeLocations length: ${safeLocations?.length}`);
      }
      
      // Check if we need to fetch users directly 
      if (Array.isArray(safeUsers) && safeUsers.length > 0) {
        userMap = new Map(safeUsers.map(u => [u.id, u]));
        console.log(`Dashboard: Using ${userMap.size} users from safeUsers`);
        
        // Check if we're missing any users
        const missingUserIds = Array.from(expenseUserIds).filter(id => !userMap.has(id as string));
        if (missingUserIds.length > 0) {
          console.warn(`Dashboard: Missing ${missingUserIds.length} users in safeUsers:`, missingUserIds);
        }
      } else {
        console.warn("Dashboard: No users available in safeUsers");
      }

      // Continue with processing expenses
      const resolvedExpenses = snapshot.docs.map((expenseDoc): ExpenseWithDetails => {
        const expenseData = expenseDoc.data();
        const category = categoryMap.get(expenseData.categoryId) || 
                         { id: expenseData.categoryId, name: 'Unknown Category', color: '#888888' };
        const location = locationMap.get(expenseData.locationId) || 
                         { id: expenseData.locationId, name: 'Unknown Location' };
        
        // Get user data from userMap
        let user = userMap.get(expenseData.paidById);
        
        // Handle missing user more robustly
        if (!user) {
          console.warn(`Dashboard: User not found for expense ${expenseDoc.id}, paidById:`, expenseData.paidById);
          const now = new Date().toISOString() as ISODateString;
          user = {
            id: expenseData.paidById,
            uid: expenseData.paidById,
            email: 'unknown@example.com',
            username: 'Unknown User',
            photoURL: null,
            createdAt: now,
            updatedAt: now,
            isAnonymous: false,
          };
        }
        
        // Ensure we have a valid paidBy with username field
        const paidBy = {
          id: user.id,
          uid: user.uid,
          email: user.email || '',
          username: user.username || 'Unknown User',
          photoURL: user.photoURL,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isAnonymous: user.isAnonymous,
        };

        // Process the expense data...
        const date = normalizeToDate(expenseData.date);
        if (!date) {
          console.warn(`normalizeToDate: Invalid or missing date for expense ${expenseDoc.id}:`, expenseData.date);
        }
        
        // Ensure amount is a number
        const amount = Number(expenseData.amount) || 0;

        const expenseBase = {
          id: expenseDoc.id as UUID,
          amount: validatePositiveNumber(amount, 'amount'),
          description: expenseData.description || "",
          date: date,
          paidById: expenseData.paidById,
          splitType: expenseData.splitType || "50/50",
          categoryId: expenseData.categoryId,
          locationId: expenseData.locationId,
          month: expenseData.month,
          createdAt: expenseData.createdAt?.toDate() || new Date(),
          updatedAt: expenseData.updatedAt?.toDate(),
          splitBetweenIds: expenseData.splitBetweenIds || []
        };
        return { ...expenseBase, category, location, paidBy };
      });

      resolvedExpenses.sort((a, b) => {
        const isDate = (d: unknown): d is Date => d instanceof Date;
        const aTime = isDate(a.date) && !isNaN(a.date.getTime()) ? a.date.getTime() : 0;
        const bTime = isDate(b.date) && !isNaN(b.date.getTime()) ? b.date.getTime() : 0;
        return bTime - aTime;
      });
      console.log("✅ Dashboard: Resolved expenses:", resolvedExpenses.length);
      
      return resolvedExpenses;
    } catch (error) {
      console.error("Error in fetchExpenses:", error);
      throw error; // Let React Query handle the error
    }
  }, [currentUser, safeCategories, safeLocations, safeUsers]);

  const {
    data: expensesData, // Rename data to avoid conflict
    isLoading: expensesLoading, // Use isLoading from useQuery
    error: expensesError,
    refetch: refetchExpenses,
  } = useQuery<ExpenseWithDetails[], Error>({
    queryKey: ['expenses', currentMonth], // Query key includes the month
    queryFn: () => fetchExpenses(currentMonth),
    // Simplified dependency - only require user authentication
    enabled: !!currentUser,
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
    if (!currentUser || !safeUsers.length) {
      return { 
        user1: null, 
        user1Id: undefined, 
        user1Name: undefined, 
        user2Data: null, 
        user2Id: undefined, 
        user2Name: undefined 
      };
    }
    
    const u1 = safeUsers.find(u => u.id === currentUser.uid) || null;
    const u2 = safeUsers.find(u => u.id !== currentUser.uid) || null;
    
    return {
      user1: u1,
      user1Id: u1?.id,
      user1Name: u1?.username,
      user2Data: u2,
      user2Id: u2?.id, 
      user2Name: u2?.username
    };
  }, [currentUser, safeUsers]);

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

    expenses.forEach(exp => {
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
    let user1Balance = user1_paid_50_50 - fairShare + user1_paid_100_owed_by_other - user2_paid_100_owed_by_other;
    let settlementAmount = Math.abs(user1Balance);
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

  // --- Fetch Settlement Status - IMPROVED ASYNC HANDLING ---
  useEffect(() => {
    if (!currentUser) return;
    
    setSettlementLoading(true);
    
    let isMounted = true;
    
    const fetchSettlementStatus = async () => {
      try {
        const settlementsCol = collection(db, "settlements");
        const q = query(settlementsCol, where("month", "==", currentMonth), limit(1));
        
        const snapshot = await getDocs(q);
        
        if (isMounted) {
          const isSettled = !snapshot.empty;
          console.log(`Settlement status for ${currentMonth}: ${isSettled ? 'Settled' : 'Not Settled'}`);
          setIsCurrentMonthSettled(isSettled);
          setSettlementLoading(false);
        }
      } catch (error: unknown) {
        console.error("Error fetching settlement status:", error);
        
        if (isMounted) {
          if (error instanceof FirebaseError) {
            const errorCode = error.code;
            const errorMessage = errorCode === 'permission-denied' 
              ? "Permission denied fetching settlement status (expected during development)" 
              : "Could not check settlement status";
            if (errorCode !== 'permission-denied') {
              toast({ 
                title: "Error", 
                description: errorMessage,
                variant: "destructive" 
              });
            }
          } else {
            toast({
              title: "Error",
              description: "An unknown error occurred while checking settlement status.",
              variant: "destructive"
            });
          }
          setIsCurrentMonthSettled(false);
          setSettlementLoading(false);
        }
      }
    };
    
    fetchSettlementStatus();
    
    return () => {
      isMounted = false;
    };
  }, [currentMonth, currentUser, toast]);

  const handleMonthChange = useCallback((month: string) => { 
    setCurrentMonth(month); 
  }, []);
  
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
    if (!calculatedSummary || expensesLoading || !currentUser) { 
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
  }, [calculatedSummary, expensesLoading, currentMonth, expensesData, allUsers, toast, currentUser]);
  
  const handleDeleteExpense = useCallback(async (expense: ExpenseWithDetails) => {
    try {
      await deleteExpense(expense.id);
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
    if (currentUser) {
      console.log('[Dashboard] currentUser:', { 
        id: currentUser.id, 
        uid: currentUser.uid,
        email: currentUser.email 
      });
    } else {
      console.log('[Dashboard] currentUser is null');
    }
    
    console.log('[Dashboard] allUsers:', allUsers ? `${allUsers.length} users found` : 'none');
  }, [currentUser, allUsers]);
  
  // Add debug for expenses and user relationships
  useEffect(() => {
    if (expenses.length > 0) {
      const uniqueUserIds = new Set(expenses.map(exp => exp.paidBy.id));
      console.log('[Dashboard] Expenses tied to user IDs:', Array.from(uniqueUserIds));
      
      // Check if all expense user IDs exist in safeUsers
      const safeUserIds = safeUsers.map(u => u.id);
      const missingUserIds = Array.from(uniqueUserIds).filter(id => !safeUserIds.includes(id as UUID));
      
      if (missingUserIds.length > 0) {
        console.warn('[Dashboard] Some expense users not found in safeUsers:', missingUserIds);
      } else {
        console.log('[Dashboard] All expense users exist in safeUsers');
      }
    }
  }, [expenses, safeUsers]);

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
                  onClick={() => setIsExportMenuOpen(prev => !prev)}
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
                    className="absolute right-0 z-10 mt-2 w-40 p-1 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-labelledby="export-menu-button"
                    onClick={() => setIsExportMenuOpen(false)}
                  >
                    <button
                      className="w-full text-left px-4 py-2 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                      onClick={() => handleExport('csv')}
                    >
                      Export as CSV
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700"
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div> <LazySummaryCard title="Total" value={formatCurrency(calculatedSummary?.totalExpenses || 0)} icon={PoundSterling} variant="total" isLoading={Boolean(dataIsLoading)} /> </div>
          <div> <LazySummaryCard title={`${user1Name || 'User 1'} Paid`} value={formatCurrency(user1Id ? calculatedSummary?.userExpenses?.[user1Id] || 0 : 0)} icon={Users} variant="user1" isLoading={Boolean(dataIsLoading)} tooltip={user1Name ? `Amount paid by ${user1Name}` : 'Amount paid by User 1'} photoURL={user1?.photoURL || undefined} email={user1?.email || undefined} /> </div>
          <div> <LazySummaryCard title={`${user2Name || 'User 2'} Paid`} value={formatCurrency(user2Id ? calculatedSummary?.userExpenses?.[user2Id] || 0 : 0)} icon={Users} variant="user2" isLoading={Boolean(dataIsLoading)} tooltip={user2Name ? `Amount paid by ${user2Name}` : 'Amount paid by User 2'} photoURL={user2Data?.photoURL || undefined} email={user2Data?.email || undefined} /> </div>
          <div> <LazySummaryCard title={balanceTitle} value={formatCurrency(Math.ceil((calculatedSummary?.settlementAmount ?? 0) * 100) / 100)} icon={WalletCards} variant="balance" isNegative={Boolean(owingUserId === user1Id)} isLoading={Boolean(dataIsLoading)} tooltip={balanceTooltip} photoURL={owingUser?.photoURL || undefined} email={owingUser?.email || undefined} /> </div>
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
    </>
  );
}
