import React, { Suspense, lazy, ComponentType, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Lazy load the chart components with explicit chunk names for better control
export const LazyEnhancedTrendChart = lazy(() =>
  import(/* webpackChunkName: "trend-chart" */ './EnhancedTrendChart')
);
export const LazyEnhancedDataChart = lazy(() =>
  import(/* webpackChunkName: "data-chart" */ './EnhancedDataChart')
);

interface LazyChartWrapperProps {
  title: string;
  component: ComponentType<any>;
  props: any;
  fallback?: React.ReactNode;
}

export default function LazyChartWrapper({
  title,
  component: Component,
  props,
  fallback
}: LazyChartWrapperProps) {
  // State to track if DOM is ready
  const [isDomReady, setIsDomReady] = useState(false);

  // Wait for DOM to be fully loaded
  useEffect(() => {
    if (document.readyState === 'complete') {
      setIsDomReady(true);
    } else {
      const handleDomContentLoaded = () => setIsDomReady(true);
      document.addEventListener('DOMContentLoaded', handleDomContentLoaded);
      window.addEventListener('load', handleDomContentLoaded);

      // Cleanup
      return () => {
        document.removeEventListener('DOMContentLoaded', handleDomContentLoaded);
        window.removeEventListener('load', handleDomContentLoaded);
      };
    }
  }, []);

  // Default fallback UI
  const defaultFallback = (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-md" />
      </CardContent>
    </Card>
  );

  // If DOM is not ready yet, show fallback
  if (!isDomReady) {
    return fallback || defaultFallback;
  }

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <div className="chart-container">
        <Component {...props} />
      </div>
    </Suspense>
  );
}