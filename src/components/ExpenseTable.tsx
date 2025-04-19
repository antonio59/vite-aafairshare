import React, { useState, useMemo, memo, useCallback } from "react"; // Add memo and useCallback
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input
import { Pencil, Trash2, Search } from "lucide-react"; // Import Search icon
import { formatDate, formatCurrency, getCategoryColorClass } from "@/lib/utils"; // Import getCategoryColorClass
import { type ExpenseWithDetails, type User } from "@shared/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseTableProps {
  expenses: ExpenseWithDetails[];
  users?: User[]; // Keep users in props definition for API consistency
  onEdit: (expense: ExpenseWithDetails) => void;
  onDelete: (expense: ExpenseWithDetails) => void;
  isLoading: boolean;
  isMonthSettled?: boolean; // Make optional for backward compatibility if needed, but required is better
}

// Memoize the skeleton component since it doesn't change
const ExpenseCardSkeleton = memo(() => (
  <div className="block border border-gray-200 rounded-md p-3 mb-3 md:hidden">
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-28" /> {/* Category */}
        <Skeleton className="h-5 w-24" /> {/* Amount */}
      </div>
      <Skeleton className="h-3 w-20 mb-1" /> {/* Location */}
      <Skeleton className="h-4 w-full mb-2" /> {/* Description */}
      <div className="flex justify-between items-center text-xs">
        <div className="space-y-1">
          <Skeleton className="h-3 w-24" /> {/* Paid By */}
          <Skeleton className="h-3 w-16" /> {/* Split */}
          <Skeleton className="h-3 w-20" /> {/* Date */}
        </div>
        <div className="flex space-x-1">
          <Skeleton className="h-7 w-7 rounded-md" /> {/* Edit */}
          <Skeleton className="h-7 w-7 rounded-md" /> {/* Delete */}
        </div>
      </div>
    </div>
  </div>
));

// Create a memoized expense row component for desktop view
const ExpenseTableRow = memo(({ 
  expense, 
  onEdit, 
  onDelete, 
  isMonthSettled 
}: { 
  expense: ExpenseWithDetails; 
  onEdit: (expense: ExpenseWithDetails) => void; 
  onDelete: (expense: ExpenseWithDetails) => void;
  isMonthSettled: boolean;
}) => (
  <TableRow key={expense.id} className="border-b border-gray-200">
    <TableCell className="py-2 px-3 text-xs">{formatDate(expense.date)}</TableCell>
    <TableCell className="py-2 px-3 text-xs">
      <div className="flex flex-col gap-0.5">
        <span className={`text-xs font-medium ${getCategoryColorClass(expense.category?.name)}`}>
          {expense.category?.name || "Uncategorized"}
        </span>
        <span className="text-xs text-muted-foreground">
          {expense.location?.name || "-"}
        </span>
      </div>
    </TableCell>
    <TableCell className="py-2 px-3 text-xs">{expense.description || "-"}</TableCell>
    <TableCell className="py-2 px-3 text-xs text-right font-medium">
      {formatCurrency(expense.amount)}
    </TableCell>
    <TableCell className="py-2 px-3 text-xs">
      {expense.paidBy?.username ?? "-"}
    </TableCell>
    <TableCell className="py-2 px-3 text-xs">{expense.splitType || "50/50"}</TableCell>
    <TableCell className="py-2 px-1 text-xs">
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(expense)}
          className="h-7 w-7 hover:bg-background"
          disabled={isMonthSettled} // Disable if month is settled
          aria-label={isMonthSettled ? "Cannot edit settled expense" : "Edit"}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">{isMonthSettled ? "Cannot edit settled expense" : "Edit"}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(expense)}
          className="h-7 w-7 hover:bg-background text-destructive hover:text-destructive"
          disabled={isMonthSettled} // Disable if month is settled
          aria-label={isMonthSettled ? "Cannot delete settled expense" : "Delete"}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">{isMonthSettled ? "Cannot delete settled expense" : "Delete"}</span>
        </Button>
      </div>
    </TableCell>
  </TableRow>
));

// Create a memoized expense card component for mobile view
const ExpenseCard = memo(({ 
  expense, 
  onEdit, 
  onDelete, 
  isMonthSettled 
}: { 
  expense: ExpenseWithDetails; 
  onEdit: (expense: ExpenseWithDetails) => void; 
  onDelete: (expense: ExpenseWithDetails) => void;
  isMonthSettled: boolean;
}) => (
  <div className="block border border-gray-200 rounded-md p-3 bg-background">
    {/* Top Row: Category/Location and Amount */}
    <div className="flex justify-between items-start mb-1">
      <div className="flex flex-col text-xs">
        <span className={`font-medium text-sm ${getCategoryColorClass(expense.category?.name)}`}> {/* Use Tailwind class */}
          {expense.category?.name || "Uncategorized"}
        </span>
        <span className="text-muted-foreground">{expense.location?.name || "-"}</span>
      </div>
      <div className="text-base font-semibold text-right">{formatCurrency(expense.amount)}</div>
    </div>

    {/* Description Row (Conditional) */}
    {expense.description && (
      <div className="text-sm mb-2 truncate" title={expense.description}>
        {expense.description}
      </div>
    )}

    {/* Bottom Row: PaidBy/Split/Date and Actions */}
    <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-1.5 mt-1.5">
      <div className="flex flex-col"> {/* Make this div a column */}
        {/* Div for Paid by and Split */}
        <div>
          <span>Paid by: {expense.paidBy?.username ?? "-"}</span>
          <span className="mx-1.5">•</span> {/* Separator */}
          <span>Split: {expense.splitType || "50/50"}</span>
        </div>
        {/* Div for Date on new line */}
        <div>
          <span>{formatDate(expense.date)}</span>
        </div>
      </div>
      <div className="flex space-x-0.5"> {/* Added small space for buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(expense)}
          className="h-7 w-7"
          disabled={isMonthSettled} // Disable if month is settled
          aria-label={isMonthSettled ? "Cannot edit settled expense" : "Edit"}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(expense)}
          className="h-7 w-7 text-destructive hover:text-destructive"
          disabled={isMonthSettled} // Disable if month is settled
          aria-label={isMonthSettled ? "Cannot delete settled expense" : "Delete"}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  </div>
));

// Main ExpenseTable component with React.memo
function ExpenseTableComponent({ expenses, onEdit, onDelete, isLoading, isMonthSettled = false }: ExpenseTableProps) {
  const [filterText, setFilterText] = useState("");

  // Use useCallback for event handlers
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  }, []);

  // Filter expenses based on search text - optimized with useMemo
  const filteredExpenses = useMemo(() => {
    // Quick return if no filter is applied
    if (!filterText) {
      return expenses;
    }

    // Only lowercase the filter text once
    const lowerCaseFilter = filterText.toLowerCase();

    // Create a single filter function that checks all relevant fields
    return expenses.filter(exp => {
      // Check each field that should be searchable
      const categoryMatch = exp.category?.name?.toLowerCase().includes(lowerCaseFilter);
      const locationMatch = exp.location?.name?.toLowerCase().includes(lowerCaseFilter);
      const paidByMatch = exp.paidBy?.username?.toLowerCase().includes(lowerCaseFilter);
      const descriptionMatch = exp.description?.toLowerCase().includes(lowerCaseFilter);

      // Return true if any field matches
      return categoryMatch || locationMatch || paidByMatch || descriptionMatch;
    });
  }, [expenses, filterText]);

  const hasExpenses = expenses.length > 0;
  const hasFilteredExpenses = filteredExpenses.length > 0;
  const showNoResultsMessage = hasExpenses && !hasFilteredExpenses; // Show only if filtering yielded no results
  const showNoDataMessage = !hasExpenses && !isLoading; // Show only if there's no data initially

  return (
    <div className="w-full space-y-4"> {/* Added space-y-4 */}
      {/* Filter Input - Only show if there are expenses to filter */}
      {hasExpenses && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by category, location, paid by..." // Updated placeholder
            value={filterText}
            onChange={handleFilterChange}
            className="pl-8 w-full"
          />
        </div>
      )}

      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden md:block border border-gray-200 rounded-md overflow-hidden bg-background">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category/Location</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead>Split</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading expenses...
                </TableCell>
              </TableRow>
            ) : hasFilteredExpenses ? (
              filteredExpenses.map((expense) => (
                <ExpenseTableRow
                  key={expense.id}
                  expense={expense}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isMonthSettled={isMonthSettled}
                />
              ))
            ) : showNoResultsMessage ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No expenses match your filter "{filterText}".
                </TableCell>
              </TableRow>
            ) : showNoDataMessage ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No expenses recorded for this period.
                </TableCell>
              </TableRow>
            ) : null /* Handle loading case separately */}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View (visible on small screens) */}
      <div className="md:hidden space-y-1.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <ExpenseCardSkeleton key={index} />)
        ) : hasFilteredExpenses ? (
          filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={onEdit}
              onDelete={onDelete}
              isMonthSettled={isMonthSettled}
            />
          ))
        ) : showNoResultsMessage ? (
          <div className="text-center text-muted-foreground py-10">
            No expenses match your filter "{filterText}".
          </div>
        ) : showNoDataMessage ? (
          <div className="text-center text-muted-foreground py-10">
            No expenses recorded for this period.
          </div>
        ) : null /* Handle loading case separately */}
      </div>

      {/* Total Count - Updated to show filtered count */}
      {!isLoading && hasExpenses && ( // Only show count if there was data initially
        <div className="text-sm text-muted-foreground mt-4">
          {filterText
            ? `Showing ${filteredExpenses.length} of ${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`
            : `Total: ${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`
          }
        </div>
      )}
    </div>
  );
}

// Export memoized component
export const ExpenseTable = memo(ExpenseTableComponent);
