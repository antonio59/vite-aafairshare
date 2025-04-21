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
  onChange: (month: string) => void;
}

export function LazyMonthSelector({ onChange }: LazyMonthSelectorProps) {
  // No unused arguments; this function only uses its props.

  // If the consumer passes an unused argument, allow it as _month for lint compliance.

  return (
    <Suspense fallback={<MonthSelectorSkeleton />}>
      <MonthSelector onChange={onChange} />
    </Suspense>
  );
}
