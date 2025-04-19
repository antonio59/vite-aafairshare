import { useState, useCallback, useId, useEffect } from "react"; // Added useEffect
import MonthSelector from "@/components/MonthSelector";
import { ExpenseTable } from "@/components/ExpenseTable";
import ExpenseForm from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
// Removed unused QueryKey import
import { useQuery, useQueryClient } from "@tanstack/react-query";
// Removed unused Settlement, SettlementWithUsers imports
import { Category, Expense, ExpenseWithDetails, Location, MonthSummary, User } from "@shared/types";
import { validateUUID, validateISODateString } from '@shared/types';
// Removed unused DocumentReference, QueryDocumentSnapshot, DocumentData imports
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentMonth, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { exportExpenses } from "@/lib/exportUtils";
// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
// Removed unused apiRequest import
// Removed unused queryClient import
// import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toISODateString } from "@shared/utils/typeGuards";

// Removed unused fetchSettlementsData function
// async function fetchSettlementsData(...) { ... }

// Helper to create a default empty summary object
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

const UNKNOWN_UUID = validateUUID('00000000-0000-4000-8000-000000000000', 'id');
const UNKNOWN_DATE = new Date(); // Use Date for createdAt in Category/Location fallback

export default function Expenses() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | undefined>(undefined);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  // Generate unique IDs for accessibility
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const queryClient = useQueryClient(); // Get query client instance

  // --- State for Expenses fetched via useEffect ---
  const [displayedExpenses, setDisplayedExpenses] = useState<ExpenseWithDetails[] | null>(null); // Initialize as null
  const [isExpensesLoading, setIsExpensesLoading] = useState(true);
  // --- End State ---

  // --- useEffect for fetching expenses ---
  useEffect(() => {
    // Removed isMounted flag
    const fetchExpenses = async () => {
      console.log("🔥 FETCHING EXPENSES FROM FIRESTORE FOR MONTH:", currentMonth);
      setIsExpensesLoading(true);
      setDisplayedExpenses(null); // Reset to null on new fetch start

      try {
        const q = query(
          collection(db, "expenses"),
          where("month", "==", currentMonth),
          orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        console.log(`📊 Retrieved ${querySnapshot.docs.length} expenses for month: ${currentMonth}`);

        // Removed client-side filter, assuming Firestore query is reliable now.
        const expenseDocs = querySnapshot.docs;

        // Only proceed with mapping if there are docs
        let finalExpenses: ExpenseWithDetails[] = [];
        if (expenseDocs.length > 0) {
            finalExpenses = await Promise.all(
            expenseDocs.map(async expenseDoc => {
              const expenseData = expenseDoc.data() as Expense;
              const userDocRef = doc(db, "users", expenseData.paidById);
              const userDoc = await getDoc(userDocRef);
              const userData = userDoc.exists()
                ? { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) } as User
                : undefined;

              const [categorySnap, locationSnap] = await Promise.all([
                getDoc(doc(db, "categories", expenseData.categoryId)),
                getDoc(doc(db, "locations", expenseData.locationId))
              ]);

              const expenseWithDetails: ExpenseWithDetails = {
                ...expenseData,
                id: validateUUID(expenseDoc.id, 'id'),
                paidBy: userData ?? {
                  id: validateUUID(expenseData.paidById, 'id'),
                  uid: '',
                  email: '',
                  username: 'Unknown',
                  photoURL: null,
                  createdAt: validateISODateString(UNKNOWN_DATE.toISOString(), 'createdAt'),
                  updatedAt: validateISODateString(UNKNOWN_DATE.toISOString(), 'updatedAt'),
                  isAnonymous: false,
                },
                category: categorySnap.exists() ? { id: validateUUID(categorySnap.id, 'id'), ...(categorySnap.data() as Omit<Category, 'id'>) } : {
                  id: validateUUID('', 'id'),
                  name: 'Unknown',
                  icon: 'other',
                  createdAt: new Date(),
                  color: '#999'
                },
                location: locationSnap.exists() ? { id: validateUUID(locationSnap.id, 'id'), ...(locationSnap.data() as Omit<Location, 'id'>) } : {
                  id: validateUUID('', 'id'),
                  name: 'Unknown',
                  createdAt: new Date(),
                  color: '#999'
                }
              };
              return expenseWithDetails;
            })
          );
        }

        console.log(`✅ Finished processing ${finalExpenses.length} expenses for month: ${currentMonth}`);
        setDisplayedExpenses(finalExpenses); // Set the final, filtered, and mapped expenses (could be empty array)

      } catch (error: unknown) { // Changed 'any' to 'unknown'
        console.error("Failed to load expenses via useEffect:", error);
        // Type check before accessing properties
        const errorMessage = error instanceof Error ? error.message : "Failed to load expenses data. Please try again.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        setDisplayedExpenses([]); // Set empty array on error
      } finally {
        setIsExpensesLoading(false);
      }
    };

    fetchExpenses();

    // No cleanup function needed if we don't rely on isMounted
  }, [currentMonth, toast]); // Dependency array includes currentMonth and toast
  // --- End useEffect ---


  const handleMonthChange = (newMonth: string) => {
      setCurrentMonth(newMonth);
      // No explicit cache management needed for summary, key change handles it
    };

  // Fetch Categories (Keep using React Query for potentially static data)
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        console.log("🔍 Fetching categories from Firestore");
        const querySnapshot = await getDocs(collection(db, "categories"));
        
        if (querySnapshot.empty) {
          console.warn("No categories found in Firestore");
          return [];
        }
        
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        console.log(`✅ Retrieved ${categoriesData.length} categories:`, 
          categoriesData.map(c => c.name).join(', ')
        );
        return categoriesData;
      } catch (error) {
        console.error("Failed to load categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive"
        });
        return [];
      }
    },
    staleTime: 60000, // Reduced staleTime to 1 minute
  });

  // Fetch Locations (Keep using React Query)
  const { data: locations = [], isLoading: locationsLoading, refetch: refetchLocations } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      try {
        console.log("🔍 Fetching locations from Firestore");
        const querySnapshot = await getDocs(collection(db, "locations"));
        
        if (querySnapshot.empty) {
          console.warn("No locations found in Firestore");
          return [];
        }
        
        const locationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Location[];
        
        console.log(`✅ Retrieved ${locationsData.length} locations:`, 
          locationsData.map(l => l.name).join(', ')
        );
        return locationsData;
      } catch (error) {
        console.error("Failed to load locations:", error);
        toast({
          title: "Error",
          description: "Failed to load locations. Please try again.",
          variant: "destructive"
        });
        return [];
      }
    },
    staleTime: 60000, // Reduced staleTime to 1 minute
  });

  // Strictly typed Users query
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("id", "!=", ""));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.warn('No user documents found in Firestore');
          return [];
        }

        const validUsers: User[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (!doc.id || typeof doc.id !== 'string') {
            console.error('Invalid user document ID:', {
              documentId: doc.id,
              isValid: Boolean(doc.id && typeof doc.id === 'string')
            });
            toast({
              title: "Data Error",
              description: `User ${doc.id} has invalid document ID`,
              variant: "destructive"
            });
            throw new Error(`Invalid user document ${doc.id}`);
          }

          const userData: User = {
            id: validateUUID(doc.id, 'id'),
            uid: validateUUID(doc.id, 'id'),
            email: data.email || '',
            username: data.username || data.email?.split('@')[0] || 'Unknown',
            photoURL: data.photoURL,
            createdAt: data.createdAt ? validateISODateString(new Date(data.createdAt.seconds * 1000).toISOString(), 'createdAt') : validateISODateString(UNKNOWN_DATE.toISOString(), 'createdAt'),
            updatedAt: data.updatedAt ? validateISODateString(new Date(data.updatedAt.seconds * 1000).toISOString(), 'updatedAt') : validateISODateString(UNKNOWN_DATE.toISOString(), 'updatedAt'),
            isAnonymous: data.isAnonymous,
          };

          validUsers.push(userData);
        });

        return validUsers;
      } catch (error) {
        console.error("Failed to load users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive"
        });
        return [];
      }
    },
    staleTime: 1000 * 60 * 15,
  });

  // --- Handle opening the form ---
  const handleAddExpense = async () => {
    // Explicitly refetch to ensure fresh data
    setIsExpenseFormOpen(false); // Prevent flickering by ensuring dialog is closed first
    
    try {
      toast({
        title: "Loading data",
        description: "Preparing expense form...",
      });
      
      // Force refetch categories and locations
      const [categoryResult, locationResult] = await Promise.all([
        refetchCategories(),
        refetchLocations()
      ]);
      
      const categoryData = categoryResult.data || [];
      const locationData = locationResult.data || [];
      
      console.log(`📊 Opening expense form with fresh data:`);
      console.log(`- Categories: ${categoryData.length} items`);
      console.log(`- Locations: ${locationData.length} items`);
      
      if (categoryData.length === 0 || locationData.length === 0) {
        console.warn("⚠️ Still missing data after refetch");
        toast({
          title: "Warning",
          description: "Some data may not have loaded correctly. You may need to refresh the page.",
          variant: "destructive"
        });
      }
      
      // Now open the form
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
  };

  const handleEditExpense = async (expense: ExpenseWithDetails) => {
    // Explicitly refetch to ensure fresh data
    setIsExpenseFormOpen(false); // Prevent flickering by ensuring dialog is closed first
    
    try {
      toast({
        title: "Loading data",
        description: "Preparing expense form...",
      });
      
      // Force refetch categories and locations
      const [categoryResult, locationResult] = await Promise.all([
        refetchCategories(),
        refetchLocations()
      ]);
      
      const categoryData = categoryResult.data || [];
      const locationData = locationResult.data || [];
      
      console.log(`📊 Opening expense form for editing with fresh data:`);
      console.log(`- Categories: ${categoryData.length} items`);
      console.log(`- Locations: ${locationData.length} items`);
      console.log("- Expense to edit:", expense.id);
      
      if (categoryData.length === 0 || locationData.length === 0) {
        console.warn("⚠️ Still missing data after refetch");
        toast({
          title: "Warning",
          description: "Some data may not have loaded correctly. You may need to refresh the page.",
          variant: "destructive"
        });
      }
      
      // Now open the form
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
  };

  const handleCloseExpenseForm = useCallback(() => {
    setIsExpenseFormOpen(false);
    setSelectedExpense(undefined);
    // Manually trigger refetch for summary (expenses handled by useEffect)
    queryClient.refetchQueries({ queryKey: [`summary`, currentMonth], exact: true });
    // No need to refetch expenses query as it's removed
  }, [currentMonth, queryClient]);

  // Fetch summary data for the month (Keep using React Query)
  const {
    data: summary,
    // Removed unused summaryLoading and summaryError
    // isLoading: summaryLoading,
    // isError: summaryError,
  } = useQuery<MonthSummary>({ // Removed explicit context typing
    queryKey: ['summary', currentMonth] as const,
    queryFn: async ({ queryKey }) => { // Keep simple context destructuring
      const [, monthFromKey] = queryKey;

      // Ensure monthFromKey is a valid string before proceeding
      if (typeof monthFromKey !== 'string' || !monthFromKey) {
          console.warn(`Summary query: Invalid monthFromKey detected ('${monthFromKey}'). Returning default empty summary.`);
          // Use currentMonth from component state as a fallback if available and valid, otherwise empty string
          const fallbackMonth = typeof currentMonth === 'string' && currentMonth ? currentMonth : '';
          return createEmptySummary(fallbackMonth);
      }

      try {
        const expensesQuery = query(
          collection(db, "expenses"),
          where("month", "==", monthFromKey)
        );
        const expensesSnapshot = await getDocs(expensesQuery);

        // Filter summary based on fetched data for accuracy
        const filteredSummaryDocs = expensesSnapshot.docs.filter(doc => doc.data().month === monthFromKey);

        // If no matching expenses, return the default empty summary for this month
        if (filteredSummaryDocs.length === 0) {
            return createEmptySummary(monthFromKey);
        }

        const categoryTotals: Record<string, number> = {};
        const userExpenses: Record<string, number> = {};
        let totalExpenses = 0;

        filteredSummaryDocs.forEach(doc => {
          const expense = doc.data() as ExpenseWithDetails;
          totalExpenses += expense.amount;

          if (!categoryTotals[expense.categoryId]) {
            categoryTotals[expense.categoryId] = 0;
          }
          categoryTotals[expense.categoryId] += expense.amount;

          if (!userExpenses[expense.paidById]) {
            userExpenses[expense.paidById] = 0;
          }
          userExpenses[expense.paidById] += expense.amount;
        });

        const calculatedSummary: MonthSummary = {
          month: monthFromKey, // monthFromKey is guaranteed string here
          totalExpenses,
          userExpenses,
          settlementAmount: 0,
          settlementDirection: { fromUserId: '', toUserId: '' },
          categoryTotals: Object.entries(categoryTotals).map(([categoryId, amount]) => ({
            amount,
            percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
            category: categories.find(c => c.id === categoryId) ?? { id: validateUUID(categoryId, 'id'), name: 'Unknown', icon: 'other', createdAt: new Date(), color: '#999' }
          })),
          locationTotals: [],
          splitTypeTotals: {
            "50/50": 0,
            "100%": 0
          },
          dateDistribution: {}
        };

        return calculatedSummary;
      } catch (error) {
        console.error("Failed to load summary:", error);
        toast({
          title: "Error",
          description: "Failed to load summary data. Please try again.",
          variant: "destructive"
        });
        // Return default empty summary on error, ensuring month is a string
        return createEmptySummary(monthFromKey || '');
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: !!currentMonth,
    // Provide initial data matching the empty structure
    initialData: () => createEmptySummary(currentMonth),
  });

  // Removed commented out settlements query

  const handleExport = (format: 'csv' | 'pdf') => {
    // Use displayedExpenses from local state (needs mapping back to ExpenseWithDetails if used)
    const expensesToExport = (displayedExpenses || []).map(exp => {
      const category = categories.find(c => c.id === exp.categoryId) ?? { id: UNKNOWN_UUID, name: 'Unknown', icon: 'other', createdAt: UNKNOWN_DATE, color: '#999' };
      const location = locations.find(l => l.id === exp.locationId) ?? { id: UNKNOWN_UUID, name: 'Unknown', createdAt: UNKNOWN_DATE, color: '#999' };
      const paidBy = users.find(u => u.id === exp.paidById) ?? {
        id: UNKNOWN_UUID,
        uid: UNKNOWN_UUID,
        email: '',
        username: 'Unknown',
        photoURL: null,
        createdAt: validateISODateString(UNKNOWN_DATE.toISOString(), 'createdAt'),
        updatedAt: validateISODateString(UNKNOWN_DATE.toISOString(), 'updatedAt'),
        isAnonymous: false,
      };
      return {
        ...exp,
        category,
        location,
        paidBy
      } as ExpenseWithDetails;
    });
    if (expensesToExport && expensesToExport.length > 0) {
      exportExpenses({
        format,
        month: currentMonth,
        expenses: expensesToExport, // Use mapped data
        settlements: [], // Pass empty array as settlements are commented out
        summary, // Use summary from useQuery
        allUsers: users
      });
    } else {
      toast({
        title: "Export failed",
        description: "No expenses to export for the selected month.",
        variant: "destructive"
      });
    }
  };

  // Map raw expenses to ExpenseWithDetails for the table prop
  const tableExpenses: ExpenseWithDetails[] = (displayedExpenses || []).map(exp => {
    const category = categories.find(c => c.id === exp.categoryId) ?? { id: UNKNOWN_UUID, name: 'Unknown', icon: 'other', createdAt: UNKNOWN_DATE, color: '#999' };
    const location = locations.find(l => l.id === exp.locationId) ?? { id: UNKNOWN_UUID, name: 'Unknown', createdAt: UNKNOWN_DATE, color: '#999' };
    const paidBy = users.find(u => u.id === exp.paidById) ?? {
      id: UNKNOWN_UUID,
      uid: UNKNOWN_UUID,
      email: '',
      username: 'Unknown',
      photoURL: null,
      createdAt: validateISODateString(UNKNOWN_DATE.toISOString(), 'createdAt'),
      updatedAt: validateISODateString(UNKNOWN_DATE.toISOString(), 'updatedAt'),
      isAnonymous: false,
    };
    return {
      ...exp,
      category,
      location,
      paidBy
    };
  });

  const handleDeleteExpense = async (expense: ExpenseWithDetails) => {
    try {
      if (!expense.id) {
        toast({ 
          title: "Error",
          description: "Cannot delete expense: Missing ID", 
          variant: "destructive" 
        });
        return;
      }
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
      
      console.log("🗑️ DELETING EXPENSE:", expense.id);
      await deleteDoc(doc(db, "expenses", expense.id));
      console.log("✅ EXPENSE DELETED:", expense.id);
      
      // Refetch expenses
      setIsExpensesLoading(true);
      const fetchExpenses = async () => {
        // Refetch logic similar to useEffect
        console.log("🔄 REFETCHING EXPENSES AFTER DELETE");
        try {
          const q = query(
            collection(db, "expenses"),
            where("month", "==", currentMonth),
            orderBy("date", "desc")
          );
          const querySnapshot = await getDocs(q);
          console.log(`📊 After delete: Retrieved ${querySnapshot.docs.length} expenses for month: ${currentMonth}`);
          
          // Map the query results to ExpenseWithDetails
          const expenseDocs = querySnapshot.docs;
          let finalExpenses: ExpenseWithDetails[] = [];
          
          if (expenseDocs.length > 0) {
            finalExpenses = await Promise.all(
              expenseDocs.map(async expenseDoc => {
                const expenseData = expenseDoc.data() as Expense;
                const userDocRef = doc(db, "users", expenseData.paidById);
                const userDoc = await getDoc(userDocRef);
                const userData = userDoc.exists()
                  ? { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) } as User
                  : undefined;

                const [categorySnap, locationSnap] = await Promise.all([
                  getDoc(doc(db, "categories", expenseData.categoryId)),
                  getDoc(doc(db, "locations", expenseData.locationId))
                ]);

                const expenseWithDetails: ExpenseWithDetails = {
                  ...expenseData,
                  id: validateUUID(expenseDoc.id, 'id'),
                  paidBy: userData ?? {
                    id: validateUUID(expenseData.paidById, 'id'),
                    uid: '',
                    email: '',
                    username: 'Unknown',
                    photoURL: null,
                    createdAt: toISODateString(new Date()),
                    updatedAt: toISODateString(new Date()),
                    isAnonymous: false,
                  },
                  category: categorySnap.exists() ? { id: categorySnap.id, ...(categorySnap.data() as Omit<Category, 'id'>) } : {
                    id: '',
                    name: 'Unknown',
                    icon: 'other',
                    createdAt: new Date(),
                    color: '#999'
                  },
                  location: locationSnap.exists() ? { id: locationSnap.id, ...(locationSnap.data() as Omit<Location, 'id'>) } : {
                    id: '',
                    name: 'Unknown',
                    createdAt: new Date(),
                    color: '#999'
                  }
                };
                return expenseWithDetails;
              })
            );
          }
          
          console.log(`✅ After delete: Finished processing ${finalExpenses.length} expenses`);
          setDisplayedExpenses(finalExpenses);
        } catch (error) {
          console.error("Error refetching expenses:", error);
          toast({
            title: "Error",
            description: "Failed to refresh expenses after deletion.",
            variant: "destructive"
          });
        } finally {
          setIsExpensesLoading(false);
        }
      };
      
      await fetchExpenses();
      
      // Also invalidate any summary data
      console.log("♻️ INVALIDATING QUERIES FOR SUMMARY");
      queryClient.invalidateQueries({ queryKey: [`summary`, currentMonth] });
      
      toast({ 
        title: "Success", 
        description: "Expense deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({ 
        title: "Error", 
        description: "Failed to delete expense", 
        variant: "destructive" 
      });
    }
  };

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
          {/* Conditionally render table or loading state */}
          {isExpensesLoading || displayedExpenses === null ? ( // Check for null as well
             <div className="p-6 text-center">
                <Skeleton className="h-8 w-1/2 mx-auto mb-4" />
                <Skeleton className="h-6 w-3/4 mx-auto" />
             </div>
          ) : (
            <ExpenseTable
              key={currentMonth} // Add key based on month
              expenses={tableExpenses} // Pass the mapped data
              users={users} // Pass the actual users data
              onEdit={handleEditExpense}
              onDelete={(expense) => {
                setExpenseToDelete(expense);
                setIsDeleteDialogOpen(true);
              }}
              isLoading={false} // Loading is handled outside now
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
          aria-labelledby={dialogTitleId} // Add this line
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
              onClose={handleCloseExpenseForm}
              categories={categories || []}
              locations={locations || []}
              users={users || []}
              isLoading={false} // We're already checking loading states before rendering
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

      {/* Delete Confirmation Dialog */}
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
              onClick={() => expenseToDelete && handleDeleteExpense(expenseToDelete)}
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
