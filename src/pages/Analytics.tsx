import { useState, useEffect, useMemo } from "react";
import MonthSelector from "@/components/MonthSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { announce } from "@/components/LiveRegion";
import { formatCurrency, formatMonthYear, getCurrentMonth, getMonthFromDate } from "@/lib/utils";
import { getUserColor, getCategoryColor, getLocationColor } from "@/lib/chartColors";
import { DataChart, TrendChart } from "@/components/AnalyticsChart";
import { useAuth } from "@/contexts/AuthContext";
import { MonthSummary, User, TrendData, Expense, Settlement, Category, Location } from "@shared/types";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { subMonths, startOfMonth } from "date-fns";
import type { UUID, ISODateString } from '@shared/types';

// Helper to safely format dates to ISO string
function toISODateString(dateValue: unknown): ISODateString | undefined {
  if (!dateValue) return undefined;
  const date = new Date(dateValue as string | number | Date);
  return isNaN(date.getTime()) ? undefined : (date.toISOString() as ISODateString);
}

export default function Analytics() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  // State for Firestore data
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState<Expense[]>([]);
  const [currentMonthExpensesLoading, setCurrentMonthExpensesLoading] = useState(true);
  const [currentMonthSettlements, setCurrentMonthSettlements] = useState<Settlement[]>([]);
  const [currentMonthSettlementsLoading, setCurrentMonthSettlementsLoading] = useState(true);
  const [trendExpenses, setTrendExpenses] = useState<Expense[]>([]);
  const [trendExpensesLoading, setTrendExpensesLoading] = useState(true);

  // State for calculated data
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [trendDataLoading, setTrendDataLoading] = useState(true);

  // Effect to show message if not logged in after auth check completes
  useEffect(() => {
    if (!authLoading && !currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view analytics.",
        variant: "destructive",
      });
    }
  }, [authLoading, currentUser, toast]);

  // Fetch Users
  useEffect(() => {
    if (!currentUser) {
        setUsersLoading(false);
        setUsers([]);
        return;
    };

    setUsersLoading(true);
    const usersCol = collection(db, "users");
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(fetchedUsers);
      setUsersLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Could not load user data. Please refresh the page.",
        variant: "destructive"
      });
      setUsersLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, toast]);

  // Fetch Categories
  useEffect(() => {
     if (!currentUser) {
        setCategoriesLoading(false);
        setCategories([]);
        return;
    };

    setCategoriesLoading(true);
    const catCol = collection(db, "categories");
    const q = query(catCol, orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(fetchedCategories);
      setCategoriesLoading(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Could not load categories. Please refresh the page.",
        variant: "destructive"
      });
      setCategoriesLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, toast]);

  // Fetch Locations
  useEffect(() => {
    setLocationsLoading(true);
    const locCol = collection(db, "locations");
    const q = query(locCol, orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLocations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
      setLocations(fetchedLocations);
      setLocationsLoading(false);
    }, (error) => {
      console.error("Error fetching locations:", error);
      setLocationsLoading(false);
       toast({
        title: "Error",
        description: "Could not load locations.",
        variant: "destructive"
      });
    });
    return () => unsubscribe();
  }, [toast]);

  // Fetch Current Month Expenses
  useEffect(() => {
    if (!currentUser) {
        setCurrentMonthExpensesLoading(false);
        setCurrentMonthExpenses([]);
        return;
    };
    setCurrentMonthExpensesLoading(true);
    const expensesCol = collection(db, "expenses");
    const q = query(expensesCol, where("month", "==", currentMonth), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedExpenses = snapshot.docs.map(doc => {
         const data = doc.data();
         return {
           id: doc.id as UUID,
           amount: data.amount ?? 0,
           description: data.description ?? '',
           categoryId: data.categoryId ?? '',
           locationId: data.locationId ?? '',
           paidById: data.paidById ?? '',
           splitBetweenIds: data.splitBetweenIds ?? [],
           splitType: data.splitType ?? '50/50',
           month: data.month ?? '',
           date: toISODateString(data.date),
           createdAt: toISODateString(data.createdAt),
           updatedAt: toISODateString(data.updatedAt),
         } as Expense;
      });
      setCurrentMonthExpenses(fetchedExpenses);
      setCurrentMonthExpensesLoading(false);
    }, (error) => {
      console.error("Error fetching current month expenses:", error);
      setCurrentMonthExpensesLoading(false);
       toast({
        title: "Error",
        description: "Could not load current month expenses.",
        variant: "destructive"
      });
    });
    return () => unsubscribe();
  }, [currentMonth, currentUser, toast]);

  // Fetch Current Month Settlements
   useEffect(() => {
     if (!currentUser) {
        setCurrentMonthSettlementsLoading(false);
        setCurrentMonthSettlements([]);
        return;
     };
     setCurrentMonthSettlementsLoading(true);
     const settlementsCol = collection(db, "settlements");
     const q = query(settlementsCol, where("month", "==", currentMonth));
     const unsubscribe = onSnapshot(q, (snapshot) => {
       const fetchedSettlements = snapshot.docs.map(doc => {
         const data = doc.data();
         return {
           id: doc.id as UUID,
           fromUserId: data.fromUserId ?? '',
           toUserId: data.toUserId ?? '',
           amount: data.amount ?? 0,
           status: data.status ?? 'PENDING',
           month: data.month ?? '',
           date: toISODateString(data.date),
           createdAt: toISODateString(data.createdAt),
           updatedAt: toISODateString(data.updatedAt),
         } as Settlement;
       });
       setCurrentMonthSettlements(fetchedSettlements);
       setCurrentMonthSettlementsLoading(false);
     }, (error) => {
       console.error("Error fetching settlements:", error);
       setCurrentMonthSettlementsLoading(false);
        toast({
            title: "Error",
            description: "Could not load settlements.",
            variant: "destructive"
        });
     });
     return () => unsubscribe();
   }, [currentMonth, currentUser, toast]);

   // Fetch Expenses for Trend Calculation (e.g., last 6 months)
   useEffect(() => {
     if (!currentUser) {
        setTrendExpensesLoading(false);
        setTrendExpenses([]);
        return;
     };
     setTrendExpensesLoading(true);
     const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)); // Start of month 6 months ago (inclusive)
     const expensesCol = collection(db, "expenses");
     const q = query(expensesCol, where("date", ">=", Timestamp.fromDate(sixMonthsAgo)), orderBy("date", "asc"));

     const unsubscribe = onSnapshot(q, (snapshot) => {
         const fetchedExpenses = snapshot.docs.map(doc => {
             const data = doc.data();
             // Helper to convert Firestore Timestamp or string to ISO date string (YYYY-MM-DD)
             const toISO = (val: unknown): string => {
               if (val instanceof Timestamp) return val.toDate().toISOString().slice(0, 10);
               if (typeof val === 'string') return val.slice(0, 10);
               return '';
             };
             return {
                 id: doc.id as UUID,
                 amount: data.amount ?? 0,
                 description: data.description ?? '',
                 categoryId: data.categoryId ?? '',
                 locationId: data.locationId ?? '',
                 paidById: data.paidById ?? '',
                 splitBetweenIds: data.splitBetweenIds ?? [],
                 splitType: data.splitType ?? '50/50',
                 month: data.month ?? '',
                 date: toISO(data.date),
                 createdAt: toISO(data.createdAt),
                 updatedAt: toISO(data.updatedAt),
             } as Expense;
         });
         setTrendExpenses(fetchedExpenses);
         setTrendExpensesLoading(false);
     }, (error) => {
         console.error("Error fetching trend expenses:", error);
         setTrendExpensesLoading(false);
          toast({
            title: "Error",
            description: "Could not load trend data.",
            variant: "destructive"
          });
     });

     return () => unsubscribe();
   }, [currentUser, toast]);

  // Calculate Summary for Current Month
  useEffect(() => {
    // Ensure user is logged in and required data is loaded
    if (!currentUser || currentMonthExpensesLoading || usersLoading || currentMonthSettlementsLoading || categoriesLoading || locationsLoading) {
      setSummaryLoading(true);
      return;
    }
    // Also ensure we have at least two users for a meaningful summary
    if (users.length < 2) {
      console.warn("Summary calculation requires at least two users.");
      setSummary(null);
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);

    try {
      const user1 = users.find(u => u.id === currentUser.uid);
      const otherUsers = users.filter(u => u.id !== currentUser.uid);

      if (!user1) {
        console.error("Current user not found in the fetched users list.");
        setSummaryLoading(false);
        setSummary(null);
        return;
      }

      // For simplicity, assuming only one other user for now. Adapt if multi-user needed.
      if (otherUsers.length !== 1) {
        console.warn(`Expected exactly one other user for summary calculation, but found ${otherUsers.length}. Skipping summary.`);
        setSummaryLoading(false);
        setSummary(null);
        return;
      }

      const user2 = otherUsers[0];

      let totalExpenses = 0;
      const userExpensesPaid: Record<string, number> = { [user1.id]: 0, [user2.id]: 0 };
      const categoryTotalsMap = new Map<string, number>();
      const locationTotalsMap = new Map<string, number>();
      const splitTypeTotals: Record<string, number> = {};

      currentMonthExpenses.forEach(exp => {
        const amount = Number(exp.amount) || 0;
        totalExpenses += amount;
        if (exp.paidById === user1.id) userExpensesPaid[user1.id] += amount;
        else if (exp.paidById === user2.id) userExpensesPaid[user2.id] += amount;

        categoryTotalsMap.set(exp.categoryId, (categoryTotalsMap.get(exp.categoryId) || 0) + amount);
        locationTotalsMap.set(exp.locationId, (locationTotalsMap.get(exp.locationId) || 0) + amount);
        splitTypeTotals[exp.splitType] = (splitTypeTotals[exp.splitType] || 0) + amount;
      });

      const fairShare = totalExpenses / 2;
      const user1Balance = userExpensesPaid[user1.id] - fairShare;

      // Log all current month settlements for debugging
      if (process.env.NODE_ENV === 'development') {
        console.group(`Settlement Calculation for ${currentMonth}`);
        console.log('Total Expenses:', totalExpenses);
        console.log(`${user1.username || user1.email} paid:`, userExpensesPaid[user1.id]);
        console.log(`${user2.username || user2.email} paid:`, userExpensesPaid[user2.id]);
        console.log('Fair share (each):', fairShare);
        console.log(`${user1.username || user1.email} balance before settlements:`, user1Balance);
        
        console.group('Current Month Settlements:');
        currentMonthSettlements.forEach(settle => {
          const fromUser = users.find(u => u.id === settle.fromUserId)?.username || 'Unknown';
          const toUser = users.find(u => u.id === settle.toUserId)?.username || 'Unknown';
          console.log(`${fromUser} paid ${toUser}: ${formatCurrency(settle.amount)} on ${new Date(settle.date).toISOString() as ISODateString}`);
        });
        console.groupEnd();
      }
      
      // Calculate how much has already been settled
      let netSettlementFromUser1ToUser2 = 0;
      currentMonthSettlements.forEach(settle => {
        const amount = Number(settle.amount) || 0;
        if (settle.fromUserId === user1.id && settle.toUserId === user2.id) netSettlementFromUser1ToUser2 += amount;
        else if (settle.fromUserId === user2.id && settle.toUserId === user1.id) netSettlementFromUser1ToUser2 -= amount;
      });

      // CORRECTED: Calculate remaining balance after existing settlements
      // If positive: user2 owes user1
      // If negative: user1 owes user2
      const finalBalance = user1Balance + netSettlementFromUser1ToUser2;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Net settlements already made:', netSettlementFromUser1ToUser2);
        console.log('Final balance after settlements:', finalBalance);
        console.groupEnd();
      }
      
      // Only the remaining amount needs to be settled
      let settlementAmount = Math.abs(finalBalance);
      let settlementDirection: { fromUserId: string; toUserId: string };
      
      // Determine who needs to pay whom based on the finalBalance
      if (finalBalance < -0.005) {
        // User1 owes User2 (current user owes the other user)
        settlementDirection = { fromUserId: user1.id, toUserId: user2.id };
      } else if (finalBalance > 0.005) {
        // User2 owes User1 (other user owes current user)
        settlementDirection = { fromUserId: user2.id, toUserId: user1.id };
      } else {
        // Balanced within rounding error, no settlement needed
        settlementAmount = 0;
        settlementDirection = { fromUserId: user1.id, toUserId: user2.id };
      }

      const categoryMap = new Map(categories.map(c => [c.id, c]));
      const locationMap = new Map(locations.map(l => [l.id, l]));

      const categoryTotals = Array.from(categoryTotalsMap.entries()).map(([id, amount]) => ({
          category: categoryMap.get(id) || { 
            id, 
            name: 'Unknown', 
            color: '#888888',
            icon: 'other' as const,
            createdAt: new Date()
          },
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      const locationTotals = Array.from(locationTotalsMap.entries()).map(([id, amount]) => ({
          location: locationMap.get(id) || { 
            id, 
            name: 'Unknown',
            color: '#888888',
            createdAt: new Date()
          },
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      const calculatedSummary: MonthSummary = {
        month: currentMonth, 
        totalExpenses, 
        userExpenses: userExpensesPaid, 
        settlementAmount, 
        settlementDirection,
        categoryTotals, 
        locationTotals, 
        splitTypeTotals, 
        dateDistribution: {}, // dateDistribution needs calculation if used
      };
      
      setSummary(calculatedSummary);
      setSummaryLoading(false);
      announce(`Summary data loaded for ${currentMonth} with total expenses of ${formatCurrency(totalExpenses)}`, true);
    } catch (error) {
      console.error("Error calculating summary:", error);
      toast({
        title: "Error",
        description: "Could not calculate summary data. Please refresh the page.",
        variant: "destructive"
      });
      setSummaryLoading(false);
    }
  }, [currentUser, currentMonthExpensesLoading, usersLoading, currentMonthSettlementsLoading, categoriesLoading, locationsLoading, users, currentMonthExpenses, currentMonthSettlements, toast, categories, locations, currentMonth]);

  // Calculate Trend Data using useMemo for better performance
  const calculatedTrendData = useMemo(() => {
    // Return null if data isn't ready
    if (!currentUser || trendExpensesLoading || categoriesLoading || locationsLoading) {
      return null;
    }

    const monthlyTotals: Record<string, number> = {};
    const categoryMonthly: Record<string, Record<string, number>> = {};
    const locationMonthly: Record<string, Record<string, number>> = {};

    // Process all expenses to calculate totals
    trendExpenses.forEach(exp => {
      const month = getMonthFromDate(exp.date);
      const amount = Number(exp.amount) || 0;
      if (!month || typeof month !== 'string' || month.length !== 7) {
        console.warn('Skipping invalid month in trend calculation:', month, exp);
        return;
      }
      monthlyTotals[month] = (monthlyTotals[month] || 0) + amount;

      if (!categoryMonthly[exp.categoryId]) categoryMonthly[exp.categoryId] = {};
      categoryMonthly[exp.categoryId][month] = (categoryMonthly[exp.categoryId][month] || 0) + amount;

      if (!locationMonthly[exp.locationId]) locationMonthly[exp.locationId] = {};
      locationMonthly[exp.locationId][month] = (locationMonthly[exp.locationId][month] || 0) + amount;
    });

    // Sort months chronologically, filter out invalid/empty months
    const months = Object.keys(monthlyTotals)
      .filter(month => !!month && typeof month === 'string' && month.length === 7)
      .sort();
    console.log('TrendChart months:', months);
    const totalsByMonth = months.map(month => monthlyTotals[month]);

    // Create maps for efficient lookups
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const locationMap = new Map(locations.map(l => [l.id, l.name]));

    // Process category data
    const categoriesData: Record<string, number[]> = {};
    for (const catId in categoryMonthly) {
      const catName = categoryMap.get(catId) || `Unknown (${catId.substring(0,4)})`;
      categoriesData[catName] = months.map(month => categoryMonthly[catId][month] || 0);
    }

    // Process location data
    const locationsData: Record<string, number[]> = {};
    for (const locId in locationMonthly) {
      const locName = locationMap.get(locId) || `Unknown (${locId.substring(0,4)})`;
      locationsData[locName] = months.map(month => locationMonthly[locId][month] || 0);
    }

    // Return the calculated trend data
    return {
      months,
      totalsByMonth,
      categoriesData,
      locationsData,
    } as TrendData;
  }, [currentUser, trendExpenses, categories, locations, trendExpensesLoading, categoriesLoading, locationsLoading]);

  // Update state based on calculated data
  useEffect(() => {
    setTrendDataLoading(true);
    if (calculatedTrendData) {
      setTrendData(calculatedTrendData);
      setTrendDataLoading(false);
      announce(`Trend data loaded with ${calculatedTrendData.months.length} months of data`);
    } else {
      setTrendData(null);
      setTrendDataLoading(false);
    }
  }, [calculatedTrendData]);

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  // Helper function to get username by ID
  const getUsernameById = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.username || user?.email?.split('@')[0] || `User...`;
  };

  // Combine all relevant loading states for overall page loading state
  const isLoading = authLoading || summaryLoading || usersLoading || trendDataLoading || categoriesLoading || locationsLoading || currentMonthExpensesLoading || currentMonthSettlementsLoading;

  // Show global loading if auth is still loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Loading Analytics...</h2>
        </div>
      </div>
    );
  }

  // Show message if not logged in after auth check
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-gray-600 dark:text-gray-400">Please log in to view analytics.</p>
      </div>
    );
  }

  // Format the expense data for charts
  const userExpenseData = summary?.userExpenses 
    ? Object.entries(summary.userExpenses).map(([userId, amount]) => ({
        name: getUsernameById(userId),
        value: amount,
        percentage: summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0,
      }))
    : [];

  const categoryData = summary?.categoryTotals 
    ? summary.categoryTotals.map(item => ({
        name: item.category.name,
        value: item.amount,
        percentage: item.percentage,
      }))
    : [];

  const locationData = summary?.locationTotals 
    ? summary.locationTotals.map(item => ({
        name: item.location.name,
        value: item.amount,
        percentage: item.percentage,
      }))
    : [];

  // Format trend data for the TrendChart component
  const formattedTrendData = trendData ? {
    months: trendData.months,
    series: [
      {
        name: "Total Expenses",
        data: trendData.totalsByMonth,
        color: "#3B82F6"
      }
    ]
  } : { months: [], series: [] };

  // Format category trend data
  const categoryTrendData = trendData ? {
    months: trendData.months,
    series: Object.entries(trendData.categoriesData).map(([categoryName, values], index) => ({
      name: categoryName,
      data: values,
      color: `hsl(${(index * 25 + 60) % 360}, 70%, 50%)`
    }))
  } : { months: [], series: [] };

  // Format location trend data
  const locationTrendData = trendData ? {
    months: trendData.months,
    series: Object.entries(trendData.locationsData).map(([locationName, values], index) => ({
      name: locationName,
      data: values,
      color: `hsl(${(index * 25 + 180) % 360}, 70%, 50%)`
    }))
  } : { months: [], series: [] };

  return (
    <div className="space-y-6 px-4 md:px-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Analytics Dashboard</h1>
        <MonthSelector value={currentMonth} onChange={handleMonthChange} />
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-3 overflow-hidden border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : summary ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                    <p className="text-3xl sm:text-4xl font-bold text-primary mt-2 financial-value">
                      {formatCurrency(summary.totalExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fair Share (50/50)</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-500 mt-2 financial-value">
                      {formatCurrency(summary.totalExpenses / 2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Settlement ({getUsernameById(summary.settlementDirection.fromUserId)} → {getUsernameById(summary.settlementDirection.toUserId)})
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-500 mt-2 financial-value">
                      {formatCurrency(summary.settlementAmount)}
                    </p>
                  </div>
                </div>
                
                {/* Add settlement calculation breakdown */}
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                      Show settlement calculation details
                    </summary>
                    <div className="mt-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p><span className="font-medium">{getUsernameById(currentUser.uid)}</span> paid: {formatCurrency(summary.userExpenses[currentUser.uid])}</p>
                        <p><span className="font-medium">{getUsernameById(Object.keys(summary.userExpenses).find(id => id !== currentUser.uid) || '')}</span> paid: {formatCurrency(summary.userExpenses[Object.keys(summary.userExpenses).find(id => id !== currentUser.uid) || ''] || 0)}</p>
                        <p className="mt-1">Fair share (each): {formatCurrency(summary.totalExpenses / 2)}</p>
                        
                        {/* Show settlement history if there are any */}
                        {currentMonthSettlements.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Existing Settlements:</p>
                            {currentMonthSettlements.map((settlement, idx) => (
                              <p key={idx} className="text-gray-600 dark:text-gray-400">
                                {getUsernameById(settlement.fromUserId)} paid {getUsernameById(settlement.toUserId)} {formatCurrency(settlement.amount)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        {summary.settlementAmount > 0 ? (
                          <>
                            <p className="text-emerald-600 dark:text-emerald-400">
                              {getUsernameById(summary.settlementDirection.fromUserId)} should pay {getUsernameById(summary.settlementDirection.toUserId)} {formatCurrency(summary.settlementAmount)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {currentMonthSettlements.length > 0 
                                ? "This is the remaining amount after accounting for existing settlements."
                                : "No settlements have been made yet this month."}
                            </p>
                          </>
                        ) : (
                          <p className="text-emerald-600 dark:text-emerald-400">Expenses are already balanced for this month!</p>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No summary data available for this month.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Visualization Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Expense Comparison Chart */}
        <DataChart
          title="User Expense Comparison"
          data={userExpenseData}
          valueFormatter={formatCurrency}
          isLoading={isLoading}
          getItemColor={getUserColor}
        />
        
        {/* Category Expenses Chart */}
        <DataChart
          title="Expenses by Category"
          data={categoryData}
          valueFormatter={formatCurrency}
          isLoading={isLoading}
          getItemColor={getCategoryColor}
        />
        
        {/* Location Expenses Chart */}
        <DataChart
          title="Expenses by Location"
          data={locationData}
          valueFormatter={formatCurrency}
          isLoading={isLoading}
          getItemColor={getLocationColor}
        />
      </div>

      {/* Trend Charts */}
      <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-gray-50">Expense Trends</h2>
      <div className="grid grid-cols-1 gap-6">
        {/* Total Monthly Expenses Trend */}
        <TrendChart
          title="Monthly Expense Trends"
          data={formattedTrendData}
          valueFormatter={formatCurrency}
          xAxisFormatter={formatMonthYear}
          isLoading={isLoading || trendDataLoading}
        />
        
        {/* Category Trends */}
        <TrendChart
          title="Category Trends Over Time"
          data={categoryTrendData}
          valueFormatter={formatCurrency}
          xAxisFormatter={formatMonthYear}
          isLoading={isLoading || trendDataLoading}
        />
        
        {/* Location Trends */}
        <TrendChart
          title="Location Trends Over Time"
          data={locationTrendData}
          valueFormatter={formatCurrency}
          xAxisFormatter={formatMonthYear}
          isLoading={isLoading || trendDataLoading}
        />
      </div>
    </div>
  );
}
