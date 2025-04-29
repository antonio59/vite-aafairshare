import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

// Lazy load the SummaryCard component
const SummaryCard = lazy(() => 
  import(/* webpackChunkName: "summary-card" */ './dashboard/SummaryCard').then(module => ({
    default: module.default
  }))
);

// Create skeleton loader for the summary card
const SummaryCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-8 w-32 mt-2" />
  </div>
);

// Define props interface
interface LazySummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: 'total' | 'user1' | 'user2' | 'balance';
  isLoading?: boolean;
  isNegative?: boolean;
  tooltip?: string;
  photoURL?: string;
  email?: string;
  username?: string;
  onClick?: () => void;
}

export function LazySummaryCard(props: LazySummaryCardProps) {
  // If already loading, show skeleton directly
  if (props.isLoading) {
    return <SummaryCardSkeleton />;
  }
  
  return (
    <Suspense fallback={<SummaryCardSkeleton />}>
      <SummaryCard {...props} />
    </Suspense>
  );
}
