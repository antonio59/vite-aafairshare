/**
 * LazyExpenseTable Component
 * 
 * A lazy-loaded wrapper around ExpenseTable that improves initial load performance
 * by deferring the loading of the expense table until it's needed.
 */

import React, { Suspense, lazy, memo } from 'react';
import { ExpenseWithDetails } from '@shared/schema';

// Lazy load the ExpenseTable component to reduce initial bundle size
const ExpenseTable = lazy(() => import("./ExpenseTable").then(module => ({ 
  default: module.ExpenseTable 
})));

/**
 * Skeleton loader for the table while it's loading
 * Displays a placeholder with animated pulse effect
 */
const ExpenseTableSkeleton = memo(() => (
  <div className="space-y-4">
    <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <div className="h-10 w-full bg-muted/50 animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 w-full border-b border-gray-200 animate-pulse bg-muted/20" />
      ))}
    </div>
  </div>
));
ExpenseTableSkeleton.displayName = 'ExpenseTableSkeleton';

/**
 * Props for the LazyExpenseTable component
 */
export interface LazyExpenseTableProps {
  /** List of expenses with detailed information to display */
  expenses: ExpenseWithDetails[];
  /** Handler for editing an expense */
  onEdit: (expense: ExpenseWithDetails) => void;
  /** Handler for deleting an expense */
  onDelete: (expense: ExpenseWithDetails) => void;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether the current month is settled (disables edit/delete) */
  isMonthSettled?: boolean;
  /** 
   * Virtualization related props for future implementation.
   * These are defined here but not currently used.
   */
  itemsPerPage?: number;
  totalCount?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

/**
 * LazyExpenseTableComponent - A lazily loaded expense table with loading skeleton
 * 
 * This component uses React.Suspense to defer loading the actual ExpenseTable
 * component until it's needed, improving initial page load performance.
 * 
 * @example
 * <LazyExpenseTable
 *   expenses={expensesList}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   isLoading={isLoadingExpenses}
 *   isMonthSettled={isCurrentMonthSettled}
 * />
 */
function LazyExpenseTableComponent({ 
  expenses, 
  onEdit, 
  onDelete, 
  isLoading, 
  isMonthSettled
}: LazyExpenseTableProps): React.ReactElement {
  return (
    <Suspense fallback={<ExpenseTableSkeleton />}>
      <ExpenseTable 
        expenses={expenses} 
        onEdit={onEdit} 
        onDelete={onDelete} 
        isLoading={isLoading} 
        isMonthSettled={isMonthSettled}
      />
    </Suspense>
  );
}
LazyExpenseTableComponent.displayName = 'LazyExpenseTableComponent';

// Export memoized component for better performance
export const LazyExpenseTable = memo(LazyExpenseTableComponent);
