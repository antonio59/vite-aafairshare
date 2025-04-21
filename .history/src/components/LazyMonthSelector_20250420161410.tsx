import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the MonthSelector component
const MonthSelector = lazy(() => 
  import(/* webpackChunkName: "month-selector" */ './MonthSelector').then(module => ({
    default: module.default
  }))
);

// Create skeleton loader for the month selector
const MonthSelectorSkeleton = () => (
  <div className="w-full">
    <Skeleton className="h-10 w-full rounded-md" />
  </div>
);

// Define props interface
interface LazyMonthSelectorProps {
  value: string; // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange: (value: string) => void;
}

export function LazyMonthSelector(props: LazyMonthSelectorProps) {
  return (
    <Suspense fallback={<MonthSelectorSkeleton />}>
      <MonthSelector {...props} />
    </Suspense>
  );
}
