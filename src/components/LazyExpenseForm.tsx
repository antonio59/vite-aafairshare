import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Category, Location, User, ExpenseWithDetails } from '@shared/types';

// Lazy load the ExpenseForm component
const ExpenseForm = lazy(() => 
  import(/* webpackChunkName: "expense-form" */ './ExpenseForm').then(module => ({
    default: module.default
  }))
);

// Create skeleton loader for the form
const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="flex justify-end space-x-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// Define props interface
interface LazyExpenseFormProps {
  onClose: () => void;
  expense?: ExpenseWithDetails;
  categories: Category[];
  locations: Location[];
  users: User[];
  isLoading?: boolean;
}

export function LazyExpenseForm(props: LazyExpenseFormProps) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <ExpenseForm {...props} />
    </Suspense>
  );
}
