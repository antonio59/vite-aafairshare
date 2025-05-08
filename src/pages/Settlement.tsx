import { useState, useEffect } from "react";
import MonthSelector from "@/components/MonthSelector";
import SettlementHistory from "@/components/SettlementHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CalendarClock, X } from "lucide-react";
import { Settlement as SettlementType, User, Expense } from "@shared/types";
import { getCurrentMonth, formatCurrency, getPreviousMonth, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { SupabaseService } from '@/services/supabase.service';
import type { Tables } from '@/services/supabase.service';
import { supabase } from '../config/supabase';

// Define a specific type for the summary data needed on this page
interface SettlementPageSummary {
  month: string;
  totalExpenses: number;
  userExpenses: Record<string, number>; // { userId: amount }
}

export default function Settlement() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const setIsDialogOpen = useState(false)[1];
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch users from Supabase
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const data = await SupabaseService.get('users', { order: { column: 'username', ascending: true } });
      if (!Array.isArray(data) || data.length === 0) return [];
      if (typeof data[0] === 'object' && 'error' in data[0]) return [];
      return (data as unknown as Tables['users']['Row'][]).map(row => ({
        id: row.id,
        email: row.email,
        username: row.username ?? '',
        photoURL: row.photo_url ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? row.created_at,
        isAnonymous: row.is_anonymous ?? false,
        uid: row.id,
      }));
    }
  });

  // Fetch expenses for current month from Supabase
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', currentMonth],
    queryFn: async () => {
      const data = await SupabaseService.get('expenses', { eq: { month: currentMonth }, order: { column: 'date', ascending: false } });
      if (!Array.isArray(data) || data.length === 0) return [];
      if (typeof data[0] === 'object' && 'error' in data[0]) return [];
      return (data as unknown as Tables['expenses']['Row'][]).map(row => ({
        id: row.id,
        amount: row.amount,
        description: row.description ?? '',
        categoryId: row.category_id ?? '',
        locationId: row.location_id ?? '',
        paidById: row.paid_by_id ?? '',
        splitType: row.split_type === '50/50' || row.split_type === '100%' ? row.split_type : '50/50',
        month: row.month,
        date: row.date,
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? row.created_at,
      }));
    }
  });

  // Fetch settlements for current month from Supabase
  const { data: settlements = [], isLoading: settlementsLoading, refetch: refetchSettlements } = useQuery<SettlementType[]>({
    queryKey: ['settlements', currentMonth],
    queryFn: async () => {
      const data = await SupabaseService.get('settlements', { eq: { month: currentMonth }, order: { column: 'date', ascending: false } });
      if (!Array.isArray(data) || data.length === 0) return [];
      if (typeof data[0] === 'object' && 'error' in data[0]) return [];
      return (data as unknown as Tables['settlements']['Row'][]).map(row => ({
        id: row.id,
        amount: row.amount,
        date: row.date,
        fromUserId: row.from_user_id ?? '',
        toUserId: row.to_user_id ?? '',
        notes: row.notes ?? '',
        recordedBy: row.recorded_by ?? '',
        status: (row as any).status ?? 'PENDING',
        month: row.month,
        createdAt: row.created_at ?? '',
        updatedAt: (row as any).updated_at ?? row.created_at ?? '',
        username: '',
      }));
    }
  });

  // Fetch previous month settlements and expenses
  const previousMonth = getPreviousMonth(currentMonth);
  const { data: previousMonthSettlements = [], isLoading: previousMonthSettlementsLoading } = useQuery<SettlementType[]>({
    queryKey: ['settlements', previousMonth],
    queryFn: async () => {
      if (!previousMonth) return [];
      const data = await SupabaseService.get('settlements', { eq: { month: previousMonth }, order: { column: 'date', ascending: false } });
      if (!Array.isArray(data) || data.length === 0) return [];
      if (typeof data[0] === 'object' && 'error' in data[0]) return [];
      return (data as unknown as Tables['settlements']['Row'][]).map(row => ({
        id: row.id,
        amount: row.amount,
        date: row.date,
        fromUserId: row.from_user_id ?? '',
        toUserId: row.to_user_id ?? '',
        notes: row.notes ?? '',
        recordedBy: row.recorded_by ?? '',
        status: (row as any).status ?? 'PENDING',
        month: row.month,
        createdAt: row.created_at ?? '',
        updatedAt: (row as any).updated_at ?? row.created_at ?? '',
        username: '',
      }));
    }
  });
  const { data: previousMonthExpenses = [], isLoading: previousMonthExpensesLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', previousMonth],
    queryFn: async () => {
      if (!previousMonth) return [];
      const data = await SupabaseService.get('expenses', { eq: { month: previousMonth }, order: { column: 'date', ascending: false } });
      if (!Array.isArray(data) || data.length === 0) return [];
      if (typeof data[0] === 'object' && 'error' in data[0]) return [];
      return (data as unknown as Tables['expenses']['Row'][]).map(row => ({
        id: row.id,
        amount: row.amount,
        description: row.description ?? '',
        categoryId: row.category_id ?? '',
        locationId: row.location_id ?? '',
        paidById: row.paid_by_id ?? '',
        splitType: row.split_type === '50/50' || row.split_type === '100%' ? row.split_type : '50/50',
        month: row.month,
        date: row.date,
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? row.created_at,
      }));
    }
  });

  // --- Calculate Summary ---
  // Define state for calculated settlement details
  const [settlementAmount, setSettlementAmount] = useState(0);
  const [settlementDirection, setSettlementDirection] = useState<{ fromUserId: string; toUserId: string } | null>(null);

  // Use the new specific type for summary state
  const [summary, setSummary] = useState<SettlementPageSummary | null>(null);

  // --- Calculate Summary ---
  useEffect(() => {
    // Check if essential data is loading or missing, but don't exit early
    if (expensesLoading || usersLoading || !user || users.length < 2) {
      // Set default/empty values but don't exit early
      setSummary({
        month: currentMonth,
        totalExpenses: 0,
        userExpenses: {}
      });
      setSettlementAmount(0);
      setSettlementDirection(null);
      return;
    }
    
    // Match current user by document ID
    const user1 = users.find(u => u.id === user.uid);
    const user2 = users.find(u => u.id !== user.uid);

    if (!user1 || !user2) {
        console.error("Could not find both users. User1:", user1, "User2:", user2);
        setSummary({
          month: currentMonth,
          totalExpenses: 0,
          userExpenses: {}
        });
        setSettlementAmount(0);
        setSettlementDirection(null);
        return;
    }

    let totalExpenses = 0; // Keep total for display if needed
    let totalSplitExpenses = 0;
    const userExpensesPaid: Record<string, number> = { [user1.id]: 0, [user2.id]: 0 };
    let user1_paid_50_50 = 0;
    let user1_paid_100_owed_by_other = 0; // User1 paid, User2 owes User1
    let user2_paid_100_owed_by_other = 0; // User2 paid, User1 owes User2

    expenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      totalExpenses += amount; // Still calculate total overall expenses

      // Track who paid what
      if (exp.paidById === user1.id) userExpensesPaid[user1.id] += amount;
      else if (exp.paidById === user2.id) userExpensesPaid[user2.id] += amount;

      // Handle different split types for balance calculation
      // Default to "50/50" if splitType is missing or null
      const splitType = exp.splitType || "50/50";

      if (splitType === "50/50") {
        totalSplitExpenses += amount;
        if (exp.paidById === user1.id) {
           user1_paid_50_50 += amount;
         }
      } else if (splitType === "100%") {
        // Assumption: If split is 100%, the person who *didn't* pay owes the full amount.
        if (exp.paidById === user1.id) {
          // User1 paid, so User2 owes User1 this amount
          user1_paid_100_owed_by_other += amount;
        } else if (exp.paidById === user2.id) {
          // User2 paid, so User1 owes User2 this amount
          user2_paid_100_owed_by_other += amount;
        }
      }
      // Add handling for other split types if they exist
    });

    const fairShare = totalSplitExpenses / 2;

    // Calculate User1's balance relative to the fair share and 100% splits
    // Positive balance means User2 owes User1
    // Negative balance means User1 owes User2
    const user1Balance = user1_paid_50_50 - fairShare + user1_paid_100_owed_by_other - user2_paid_100_owed_by_other;

    // Use user1Balance to determine settlement direction and amount
    const finalBalance = user1Balance; // Use the correctly calculated balance

    // Determine settlement amount and direction based on final balance
    let calculatedSettlementAmount = 0;
    let calculatedSettlementDirection: { fromUserId: string; toUserId: string } | null = null;

    // Use a small threshold to avoid floating point issues near zero
    const threshold = 0.005;
    if (finalBalance < -threshold) { // User1 owes User2
      calculatedSettlementAmount = Math.abs(finalBalance);
      calculatedSettlementDirection = { fromUserId: user1.id, toUserId: user2.id };
    } else if (finalBalance > threshold) { // User2 owes User1
      calculatedSettlementAmount = finalBalance;
      calculatedSettlementDirection = { fromUserId: user2.id, toUserId: user1.id };
    } else { // Considered settled
      calculatedSettlementAmount = 0;
      calculatedSettlementDirection = null; // Or keep previous direction if needed for display? Set to null for clarity.
    }

    // Create the summary object using the new specific type
    const calculatedSummary: SettlementPageSummary = {
      month: currentMonth, // Use currentMonth here
      totalExpenses: totalExpenses, // Use the overall total here
      userExpenses: userExpensesPaid,
    };
    // Set the state without type assertion
    setSummary(calculatedSummary);

    // Update separate state for settlement details
    setSettlementAmount(calculatedSettlementAmount);
    setSettlementDirection(calculatedSettlementDirection);

    // Added currentMonth to dependency array
  }, [expenses, users, user, expensesLoading, usersLoading, currentMonth]); // Dependencies remain the same

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  // Updated handleUnsettlement using Supabase
  const handleUnsettlement = async (settlementId: string) => { // ID is now string
    try {
      await SupabaseService.delete('settlements', settlementId);
      toast({
        title: "Settlement removed",
        description: "The settlement has been removed successfully."
      });
      // No need to manually refetch/invalidate, React Query handles it
    } catch (error) {
      console.error("Error removing settlement:", error);
      toast({
        title: "Error",
        description: "Failed to remove settlement. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Updated handleSettlement using Supabase
  const handleSettlement = async () => {
    const isSettled = !settlementsLoading && (settlements?.length ?? 0) > 0; // Recalculate inside handler
    if (isSettled) {
      toast({ title: "Already settled", variant: "destructive" }); return;
    }
    // Use the separate settlementAmount state
    if (!settlementDirection || settlementAmount <= 0) {
      toast({ title: "Nothing to settle", description: "The balance is zero.", variant: "default" }); return;
    }
    if (!user) {
       toast({ title: "Error", description: "User not logged in.", variant: "destructive" }); return;
    }

    setIsDialogOpen(false); // Close dialog immediately

    try {
      await SupabaseService.create('settlements', {
        month: currentMonth,
        amount: settlementAmount, // Use state variable
        date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        from_user_id: settlementDirection.fromUserId, // Use snake_case for Supabase
        to_user_id: settlementDirection.toUserId, // Use snake_case for Supabase
        notes: `Settlement for ${currentMonth}`,
        recorded_by: user.uid, // Use snake_case for Supabase
        created_at: new Date().toISOString(),
      });

      toast({
        title: "Settlement recorded",
        description: "The settlement has been recorded successfully."
      });
      // No need to manually refetch/invalidate, React Query handles it
    } catch (error) {
      console.error('Settlement error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record settlement.",
        variant: "destructive"
      });
    }
  };

  // Fix getUserName function to handle undefined users array
  const getUserName = (userId: string): string => {
    // Use Supabase document ID for matching and handle undefined users
    if (!users || users.length === 0) return 'User...';
    const user = users.find(u => u.id === userId);
    return user?.username || user?.email?.split('@')[0] || `User...`; // Fallback logic
  };

  // Use settlementDirection state
  const fromUserName = settlementDirection?.fromUserId
    ? getUserName(settlementDirection.fromUserId)
    : "User A";

  const toUserName = settlementDirection?.toUserId
    ? getUserName(settlementDirection.toUserId)
    : "User B";

// Check if a settlement exists for this month (use state)
const isSettled = !settlementsLoading && settlements && settlements.length > 0;

  // Check previous month status
  const previousMonthIsSettled = !previousMonthSettlementsLoading && previousMonthSettlements && previousMonthSettlements.length > 0;
  const hasPreviousMonthExpenses = !previousMonthExpensesLoading && previousMonthExpenses && previousMonthExpenses.length > 0;
  const showUnsettledWarning = (!previousMonthIsSettled && hasPreviousMonthExpenses);

  useEffect(() => {
    const subscription = supabase
      .channel('settlements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, () => {
        // Refetch settlements on any change
        refetchSettlements();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refetchSettlements]);

return (
    <div className="space-y-6 px-2 sm:px-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Settlement</h1>
      </div>

      <MonthSelector value={currentMonth} onChange={handleMonthChange} />

      {/* Unsettled months card */}
      {showUnsettledWarning && (
        <Card className="bg-amber-50 border-amber-200 mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center">
                <div className="p-2 rounded-full bg-amber-100 flex-shrink-0">
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Unsettled Month</h3>
                  <p className="text-sm text-amber-600 mt-1">The previous month has not been settled yet.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current settlement card - made full width */}
      <Card className="border-gray-200 ">
        <CardHeader><CardTitle>Current Month Settlement</CardTitle></CardHeader>
        <CardContent>
          {/* Derive loading state directly */}
          {(expensesLoading || usersLoading) ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              {/* DEBUG LOGS OUTSIDE CONDITION */}
              {/* Removed console logs */}
              <div className="flex flex-col items-center text-center mb-4"> {/* Changed layout to flex column */}
                {/* Display logic based on isSettled */}
                {isSettled && settlements.length > 0 ? (
                  // --- Settled State ---
                  <>
                    {(() => {
                      // Show avatar of the user who received payment
                      const receivingUserId = settlements[0].toUserId;
                      const receivingUser = users.find(u => u.id === receivingUserId);
                      const name = receivingUser ? getUserName(receivingUserId) : 'User';
                      return (
                        <Avatar className="h-12 w-12 mb-2">
                          <AvatarImage src={receivingUser?.photoURL ?? undefined} alt={name} />
                          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      );
                    })()}
                    <p className="text-sm text-gray-500">Month Settled</p>
                    <p className="text-3xl font-bold mt-1 text-green-600">
                      {/* Display actual settled amount */}
                      {formatCurrency(settlements[0].amount)}
                    </p>
                  </>
                ) : (
                  // --- Unsettled State ---
                  <>
                    {/* Conditionally render Avatar based on who owes */}
                    {settlementAmount > 0 && settlementDirection && (() => {
                        // Add null check for settlementDirection
                        if (!settlementDirection) return null;
                        const userIdToFind = settlementDirection.fromUserId;
                        const foundUser = users.find(u => u.id === userIdToFind);
                        // Add null check for foundUser
                        if (!foundUser) return null;
                        const name = fromUserName || 'User';
                        return (
                          <Avatar className="h-12 w-12 mb-2">
                            {/* Add null check for photoURL */}
                            <AvatarImage src={foundUser.photoURL ?? undefined} alt={name} />
                            <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        );
                    })()}
                    <p className="text-sm text-gray-500">
                      {/* Show who owes whom or "All settled up" */}
                      {settlementAmount > 0 && settlementDirection
                        ? `${fromUserName} owes ${toUserName}`
                        : "All settled up!"}
                    </p>
                    <p className={`text-3xl font-bold mt-1 ${settlementAmount > 0 ? 'text-primary' : 'text-green-600'}`}>
                       {/* Change Math.floor to Math.ceil to match the expense table */}
                      {formatCurrency(Math.ceil(settlementAmount * 100) / 100)}
                    </p>
                  </>
                )}
              </div>

               {/* Use settlementAmount state */}
              {/* Check derived loading state */}
              {!isSettled && settlementAmount > 0 && !(expensesLoading || usersLoading) && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Check className="mr-2 h-4 w-4" /> Mark as Settled
                </Button>
              )}

              {isSettled && settlements && settlements.length > 0 && (
                <div className="flex items-center justify-between bg-green-50 text-green-600 p-3 rounded-md">
                  <p className="text-sm font-medium">Settled on {formatDate(settlements[0].date)}</p> {/* Use formatDate */}
                  <Button onClick={() => handleUnsettlement(settlements[0].id)} variant="ghost" size="icon" className="text-red-600 hover:bg-red-100">
                    <X className="h-4 w-4" />
                    {/*
                      Consider adding a confirmation dialog for unsettlement as well,
                      and potentially disabling this button while isSettling is true
                      if unsettling should be blocked during settlement.
                    */}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User summaries - moved below settlement card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {users.map((user) => {
            const amountPaid = summary?.userExpenses?.[user.id] ?? 0;
          const userName = getUserName(user.id);
          return (
            <Card key={user.id} className="border-gray-200 h-fit shadow-sm">
              <CardContent className="p-2 sm:p-3 flex items-center">
                <Avatar className="h-10 w-10 sm:h-11 sm:w-11 mr-2 flex-shrink-0 min-h-[44px] min-w-[44px]">
                  <AvatarImage src={user.photoURL ?? undefined} alt={userName} />
                    <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0 leading-tight">
                  <p className="text-xs font-medium text-gray-500 truncate">{userName} Paid</p>
                    <p className="text-base font-semibold text-gray-900 truncate">{formatCurrency(amountPaid)}</p>
                  </div>
                </CardContent>
              </Card>
            );
        })}
      </div>

      {/* Settlement history */}
      <SettlementHistory
        settlements={settlements || []} // Pass base settlements
        isLoading={settlementsLoading}
        onUnsettlement={handleUnsettlement}
        users={users} // Pass users for name lookup
      />

      {/* Confirmation Dialog - Placed inside the main div */}
      <ResponsiveDialog
        onOpenChange={() => setIsDialogOpen(false)}
        title="Confirm Settlement"
        description={`Are you sure you want to mark this month as settled? This action will record a settlement of ${formatCurrency(settlementAmount)} from ${fromUserName} to ${toUserName}.`}
      >
        <DialogFooter>
          <DialogClose asChild>
             {/* Use DialogClose for the cancel button */}
             <Button variant="outline">Cancel</Button>
          </DialogClose>
          {/* Remove AlertDialogAction wrapper, keep the Button */}
          <Button type="button" onClick={handleSettlement}>
            Mark as Settled
          </Button>
        </DialogFooter>
      </ResponsiveDialog>

    </div> // Closing tag for the main div
  ); // Closing parenthesis for the component return
}
