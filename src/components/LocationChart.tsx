import { useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { MonthSummary } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Chart, registerables } from 'chart.js';
import { cn } from "@/lib/utils";
import { stringToColor } from "@/lib/utils";

Chart.register(...registerables);

interface LocationChartProps {
  summary: MonthSummary | undefined;
  isLoading?: boolean;
}

export default function LocationChart({ summary, isLoading = false }: LocationChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (isLoading || !summary || summary.locationTotals.length === 0) return;

    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const locations = summary.locationTotals.map(lt => lt.location.name);
    const amounts = summary.locationTotals.map(lt => Number(lt.amount));
    // Generate colors based on location names
    const colors = summary.locationTotals.map(lt => stringToColor(lt.location.name));

    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: locations,
        datasets: [{
          data: amounts,
          backgroundColor: colors,
          borderColor: 'white',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                const total = context.dataset.data.reduce((acc: number, cur: number) => acc + cur, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [summary, isLoading]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Location Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[250px] sm:h-64 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.locationTotals.length === 0) {
    return (
      <Card className="overflow-hidden border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Location Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No location data available for this month.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-gray-200">
      <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800">
        <CardTitle className="text-xl">Location Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[250px] sm:h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <canvas ref={chartRef} />
          </div>
          <div>
            <div className="mt-4 md:mt-0 space-y-4 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-2">
              {summary.locationTotals.map((locationTotal) => (
                <div key={locationTotal.location.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center max-w-[65%]">
                    {/* Color box removed */}
                    <span
                      className="ml-2 text-sm truncate font-medium" // Added font-medium
                      // Use stored color if available, otherwise generate one
                      style={{ color: locationTotal.location.color || stringToColor(locationTotal.location.name) }}
                    >
                      {locationTotal.location.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 financial-value">
                      {formatCurrency(Number(locationTotal.amount))}
                    </span>
                    <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {locationTotal.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}