import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChartErrorBoundary from './ChartErrorBoundary';

// Lazy load the chart components
const EnhancedDataChart = lazy(() => import('./EnhancedDataChart'));
const EnhancedTrendChart = lazy(() => import('./EnhancedTrendChart'));

// Loading fallback component
const ChartSkeleton = ({ title }: { title: string }) => (
  <Card className="border-gray-200 dark:border-gray-700">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full rounded-md" />
    </CardContent>
  </Card>
);

interface DataChartProps {
  title: string;
  data: Array<{ name: string; value: number; percentage?: number }>;
  valueFormatter: (value: number) => string;
  height?: number;
  isLoading?: boolean;
  customColorFunction?: (name: string) => string;
  fallback: React.ReactNode;
}

export function DataChart(props: DataChartProps) {
  const { title, fallback } = props;
  
  return (
    <ChartErrorBoundary fallback={fallback}>
      <Suspense fallback={<ChartSkeleton title={title} />}>
        <EnhancedDataChart {...props} />
      </Suspense>
    </ChartErrorBoundary>
  );
}

interface TrendChartProps {
  title: string;
  trendData?: any;
  isLoading?: boolean;
  fallback: React.ReactNode;
}

export function TrendChart(props: TrendChartProps) {
  const { title, fallback } = props;
  
  return (
    <ChartErrorBoundary fallback={fallback}>
      <Suspense fallback={<ChartSkeleton title={title} />}>
        <EnhancedTrendChart {...props} />
      </Suspense>
    </ChartErrorBoundary>
  );
}
