import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, AlertCircle, Calendar, RefreshCw } from "lucide-react";
import { RecurringExpenseWithDetails, Category, Location, User } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface RecurringExpenseListProps {
  recurringExpenses?: RecurringExpenseWithDetails[];
  onEdit: (recurringExpense: RecurringExpenseWithDetails) => void;
  isLoading: boolean;
  categories?: Category[];
  locations?: Location[];
  users?: User[];
}

export function RecurringExpenseList({
  recurringExpenses = [],
  onEdit,
  isLoading,
  categories = [],
  locations = [],
  users = [],
}: RecurringExpenseListProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpenseWithDetails | null>(null);

  // Use the arrays directly without creating unused safe versions
  const safeRecurringExpenses = recurringExpenses || [];

  const handleDelete = async () => {
    if (!selectedExpense) return;

    try {
      await deleteDoc(doc(db, "recurringExpenses", selectedExpense.id));
      toast({
        title: "Success",
        description: "Recurring expense deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete recurring expense",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
    }
  };

  const handleToggleActive = async (recurringExpense: RecurringExpenseWithDetails) => {
    try {
      await updateDoc(doc(db, "recurringExpenses", recurringExpense.id), {
        isActive: !recurringExpense.isActive,
      });
      toast({
        title: "Success",
        description: `Recurring expense ${recurringExpense.isActive ? "deactivated" : "activated"} successfully`,
      });
    } catch (error) {
      console.error("Error updating recurring expense:", error);
      toast({
        title: "Error",
        description: "Failed to update recurring expense",
        variant: "destructive",
      });
    }
  };

  const getFrequencyLabel = (frequency: string): string => {
    switch (frequency) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "biweekly":
        return "Bi-weekly";
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "yearly":
        return "Yearly";
      default:
        return frequency;
    }
  };

  // Helper function to safely format dates from Firestore
  const safeFormatDate = (dateValue: any): string => {
    if (!dateValue) return "Not set";

    try {
      // Handle Firestore Timestamp
      if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
        return format(new Date(dateValue.seconds * 1000), "PP");
      }

      // Handle Date objects
      if (dateValue instanceof Date) {
        return format(dateValue, "PP");
      }

      // Handle string or number timestamps
      return format(new Date(dateValue), "PP");
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading recurring expenses...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (safeRecurringExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No recurring expenses</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              You haven't set up any recurring expenses yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recurring Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {safeRecurringExpenses.map((recurringExpense) => (
              <div
                key={recurringExpense.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <div className="flex-1 space-y-2 mb-3 md:mb-0">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">{recurringExpense.title}</h3>
                    <Badge
                      variant={recurringExpense.isActive ? "default" : "outline"}
                      className="ml-2"
                    >
                      {recurringExpense.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {recurringExpense.description || "No description"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatCurrency(recurringExpense.amount)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getFrequencyLabel(recurringExpense.frequency)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {recurringExpense.category?.name || "Unknown Category"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {recurringExpense.location?.name || "Unknown Location"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Paid by: {recurringExpense.paidByUser?.username || "Unknown"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Split: {recurringExpense.splitType}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      Starts: {safeFormatDate(recurringExpense.startDate)}
                      {recurringExpense.endDate && (
                        <> • Ends: {safeFormatDate(recurringExpense.endDate)}</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(recurringExpense)}
                  >
                    {recurringExpense.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(recurringExpense)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      setSelectedExpense(recurringExpense);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the recurring expense "{selectedExpense?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
