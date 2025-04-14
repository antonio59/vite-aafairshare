import { useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { MonthSummary } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DateDistributionChartProps {
  summary: MonthSummary | undefined;
  isLoading?: boolean;
}

export default function DateDistributionChart({ summary, isLoading = false }: DateDistributionChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (isLoading || !summary || !summary.dateDistribution) return;

    const dates = Object.keys(summary.dateDistribution);
    if (dates.length === 0) return;

    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Sort dates numerically
    const sortedDates = dates.sort((a, b) => parseInt(a) - parseInt(b));
    const values = sortedDates.map(date => summary.dateDistribution[date]);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedDates.map(date => `Day ${date}`),
        datasets: [{
          label: 'Expense Amount',
          data: values,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3
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
                return `Amount: ${formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              },
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value as number);
              },
              font: {
                size: 10
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
      <Card>
        <CardHeader>
          <CardTitle>Spending by Day</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || !summary.dateDistribution || Object.keys(summary.dateDistribution).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-gray-600">No expense data available for this month.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <CardTitle>Spending by Day</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="h-64">
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  );
}