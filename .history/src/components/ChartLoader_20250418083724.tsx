import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChartErrorBoundary from './ChartErrorBoundary';
import { DataChart, TrendChart } from './AnalyticsChart';
import type { TrendChartProps as AnalyticsTrendChartProps } from './AnalyticsChart';

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
  valueFormatter: (_value: number) => string;
  height?: number;
  isLoading?: boolean;
  customColorFunction?: (_name: string) => string;
  fallback: React.ReactNode;
}

export function DataChartLoader(props: DataChartProps) {
  const { title, fallback } = props;
  return (
    <ChartErrorBoundary fallback={fallback}>
      <Suspense fallback={<ChartSkeleton title={title} />}>
        <DataChart {...props} />
      </Suspense>
    </ChartErrorBoundary>
  );
}

interface TrendChartProps extends Omit<AnalyticsTrendChartProps, 'emptyMessage'> {
  fallback: React.ReactNode;
}

export function TrendChartLoader(props: TrendChartProps) {
  const { title, fallback, ...rest } = props;
  return (
    <ChartErrorBoundary fallback={fallback}>
      <Suspense fallback={<ChartSkeleton title={title} />}>
        <TrendChart {...rest} title={title} />
      </Suspense>
    </ChartErrorBoundary>
  );
}
