import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { RecurringExpenseList } from "@/components/RecurringExpenseList";
import RecurringExpenseForm from "@/components/RecurringExpenseForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RecurringExpenseWithDetails, Category, Location, User } from "@shared/schema";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function RecurringExpensesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedRecurringExpense, setSelectedRecurringExpense] = useState<RecurringExpenseWithDetails | null>(null);

  // Fetch categories
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        const categoriesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];

        // Sort categories alphabetically by name
        return categoriesData.sort((a, b) => {
          const nameA = a.name?.toLowerCase() || '';
          const nameB = b.name?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!currentUser,
  });

  // Fetch locations
  const {
    data: locations = [],
    isLoading: locationsLoading,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "locations"));
        const locationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Location[];

        // Sort locations alphabetically by name
        return locationsData.sort((a, b) => {
          const nameA = a.name?.toLowerCase() || '';
          const nameB = b.name?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast({
          title: "Error",
          description: "Failed to load locations",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!currentUser,
  });

  // Fetch users
  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!currentUser,
  });

  // Fetch recurring expenses - after categories, locations, and users are loaded
  const {
    data: recurringExpenses = [],
    isLoading: recurringExpensesLoading,
    refetch: refetchRecurringExpenses,
  } = useQuery({
    queryKey: ["recurringExpenses"],
    queryFn: async () => {
      if (!currentUser) return [];

      try {
        const q = query(
          collection(db, "recurringExpenses"),
          orderBy("startDate", "desc")
        );
        const querySnapshot = await getDocs(q);

        // Create maps for efficient lookups
        const categoryMap = new Map(categories.map(c => [c.id, c]));
        const locationMap = new Map(locations.map(l => [l.id, l]));
        const userMap = new Map(users.map(u => [u.id, u]));

        // Process the data to ensure proper handling of dates and references
        const recurringExpenses = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          // Populate related data
          const category = data.categoryId ? categoryMap.get(data.categoryId) : undefined;
          const location = data.locationId ? locationMap.get(data.locationId) : undefined;
          const paidByUser = data.paidByUserId ? userMap.get(data.paidByUserId) : undefined;

          return {
            id: doc.id,
            ...data,
            // Add the related data
            category,
            location,
            paidByUser,
            // Ensure we keep the Firestore Timestamp objects as is
            // They will be properly handled in the components
          };
        }) as RecurringExpenseWithDetails[];

        return recurringExpenses;
      } catch (error) {
        console.error("Error fetching recurring expenses:", error);
        toast({
          title: "Error",
          description: "Failed to load recurring expenses",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!currentUser && categories.length > 0 && locations.length > 0 && users.length > 0,
  });

  const handleFormClose = (needsRefetch?: boolean) => {
    setShowForm(false);
    setSelectedRecurringExpense(null);
    if (needsRefetch) {
      refetchRecurringExpenses();
    }
  };

  const handleEditRecurringExpense = (recurringExpense: RecurringExpenseWithDetails) => {
    setSelectedRecurringExpense(recurringExpense);
    setShowForm(true);
  };

  const isLoading = recurringExpensesLoading || categoriesLoading || locationsLoading || usersLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recurring Expenses</h1>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Recurring Expense
        </Button>
      </div>

      {showForm ? (
        <RecurringExpenseForm
          onClose={handleFormClose}
          initialData={selectedRecurringExpense || undefined}
          categories={categories}
          locations={locations}
          users={users}
          isLoading={isLoading}
        />
      ) : (
        <RecurringExpenseList
          recurringExpenses={recurringExpenses}
          onEdit={handleEditRecurringExpense}
          isLoading={isLoading}
          categories={categories}
          locations={locations}
          users={users}
        />
      )}
    </div>
  );
}
