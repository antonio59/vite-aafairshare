import { useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { MonthSummary } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Chart, registerables } from 'chart.js';
import { cn } from "@/lib/utils";

Chart.register(...registerables);

interface CategoryChartProps {
  summary: MonthSummary | undefined;
  isLoading?: boolean;
}

export default function CategoryChart({ summary, isLoading = false }: CategoryChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (isLoading || !summary || summary.categoryTotals.length === 0) return;

    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    // Define a color palette
    const colorPalette = [
      '#3b82f6', // blue-500
      '#ef4444', // red-500
      '#22c55e', // green-500
      '#eab308', // yellow-500
      '#a855f7', // purple-500
      '#f97316', // orange-500
      '#14b8a6', // teal-500
      '#ec4899', // pink-500
    ];

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const categories = summary.categoryTotals.map(ct => ct.category.name);
    const amounts = summary.categoryTotals.map(ct => Number(ct.amount));
    // Assign colors from the palette based on index
    const colors = summary.categoryTotals.map((_, index) => colorPalette[index % colorPalette.length]);

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
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
        cutout: '65%',
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
          <CardTitle className="text-xl">Category Distribution</CardTitle>
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

  if (!summary || summary.categoryTotals.length === 0) {
    return (
      <Card className="overflow-hidden border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No expense data available for this month.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-gray-200">
      {/* Header for Category Distribution Card */}
      <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800">
        <CardTitle className="text-xl">Category Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[250px] sm:h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <canvas ref={chartRef} />
          </div>
          <div>
            <div className="mt-4 md:mt-0 space-y-4 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-2">
              {summary.categoryTotals.map((categoryTotal, index) => {
                // Use the same color palette defined in useEffect
                const colorPalette = [
                  '#3b82f6', '#ef4444', '#22c55e', '#eab308',
                  '#a855f7', '#f97316', '#14b8a6', '#ec4899',
                ];
                const color = colorPalette[index % colorPalette.length];

                return (
                  <div key={categoryTotal.category.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center max-w-[65%]">
                      {/* Use a colored dot instead of applying color to text directly for better contrast */}
                      <span
                        className="w-3 h-3 rounded-full mr-2 shrink-0"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      ></span>
                      <span
                        className="text-sm truncate font-medium text-gray-700 dark:text-gray-300" // Use standard text color
                      >
                        {categoryTotal.category.name}
                      </span>
                    </div>
                    {/* Right side: amount + percentage */}
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 financial-value">
                        {formatCurrency(Number(categoryTotal.amount))}
                      </span>
                      <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {categoryTotal.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
