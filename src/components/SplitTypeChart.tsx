import { useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { MonthSummary } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface SplitTypeChartProps {
  summary: MonthSummary | undefined;
  isLoading?: boolean;
}

export default function SplitTypeChart({ summary, isLoading = false }: SplitTypeChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (isLoading || !summary || !summary.splitTypeTotals) return;

    const splitTypes = Object.keys(summary.splitTypeTotals);
    if (splitTypes.length === 0) return;

    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Use more generic labels for non-50/50 splits
    const splitTypeLabels = splitTypes.map(type => 
      type === "50/50" ? "Equal Split (50/50)" : `Other (${type})` // Show the actual type if not 50/50
    );
    const values = splitTypes.map(type => summary.splitTypeTotals[type]);
    const totalAmount = values.reduce((sum, value) => sum + value, 0);

    const colors = ['#4f46e5', '#f97316'];

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: splitTypeLabels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                const percentage = ((value / totalAmount) * 100).toFixed(1);
                return `${formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value as number);
              }
            }
          },
          y: {
            ticks: {
              font: {
                size: 12
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
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Split Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] sm:h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || !summary.splitTypeTotals || Object.keys(summary.splitTypeTotals).length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Split Type Distribution</CardTitle>
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800">
        <CardTitle className="text-xl">Split Type Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="h-[200px] sm:h-64">
          <canvas ref={chartRef} />
        </div>
        <div className="mt-4 space-y-3">
          {Object.entries(summary.splitTypeTotals).map(([splitType, amount], index) => {
            const totalAmount = Object.values(summary.splitTypeTotals).reduce((sum, val) => sum + val, 0);
            const percentage = ((amount / totalAmount) * 100).toFixed(1);
            
            return (
              <div key={splitType} className="flex items-center justify-between py-1">
                <div className="flex items-center">
                  <div 
                    className="h-3.5 w-3.5 rounded-full flex-shrink-0" 
                    // Dynamically assign colors or use a predefined palette based on index/type
                    style={{ backgroundColor: ['#4f46e5', '#f97316', '#10b981', '#3b82f6'][index % 4] }} 
                  ></div>
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {/* Apply label logic directly here */}
                    {splitType === "50/50" ? "Equal Split (50/50)" : `Other (${splitType})`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 financial-value">
                    {formatCurrency(amount)}
                  </span>
                  <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
