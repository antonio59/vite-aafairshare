import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendData } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonthYear, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BarChart2, LineChart as LineChartIcon, Table2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface EnhancedTrendChartProps {
  trendData?: TrendData;
  isLoading?: boolean;
}

// Custom tooltip component for better formatting
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
        <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center">
              <div
                className="w-3 h-3 mr-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">{entry.name}: </span>
              <span className="ml-1 font-medium">{formatCurrency(entry.value as number)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Format Y-axis ticks
const formatYAxis = (value: number) => {
  if (value >= 1000) {
    return `£${(value / 1000).toFixed(0)}k`;
  }
  return `£${value}`;
};

export default function EnhancedTrendChart({ trendData, isLoading = false }: EnhancedTrendChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [chartError, setChartError] = useState<string | null>(null);
  const chartInitialized = useRef<boolean>(false);

  // Initialize chart only after component is mounted
  useEffect(() => {
    chartInitialized.current = true;

    // Cleanup function to prevent memory leaks
    return () => {
      chartInitialized.current = false;
    };
  }, []);

  // Reset error state when trendData changes
  useEffect(() => {
    setChartError(null);
  }, [trendData]);

  // Error handler for chart rendering
  const handleChartError = useCallback((error: Error) => {
    console.error("Chart rendering error:", error);
    setChartError("Failed to render chart. Showing table view instead.");
    setViewMode('table');
  }, []);

  if (isLoading) {
    return (
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Expense Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!trendData || trendData.months.length === 0) {
    return (
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Expense Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Not enough data to show trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format month labels (e.g., 2025-03 → Mar 2025)
  const formattedMonths = trendData.months.map(month => formatMonthYear(month));

  // Prepare data for Recharts
  const chartData = trendData.months.map((month, index) => {
    const dataPoint: any = {
      month: formatMonthYear(month),
      total: trendData.totalsByMonth[index],
    };

    // Add category data
    Object.entries(trendData.categoriesData).forEach(([category, values]) => {
      if (values[index] > 0) {
        dataPoint[`cat_${category}`] = values[index];
      }
    });

    // Add location data
    Object.entries(trendData.locationsData).forEach(([location, values]) => {
      if (values[index] > 0) {
        dataPoint[`loc_${location}`] = values[index];
      }
    });

    return dataPoint;
  });

  // Get active categories (those with non-zero values)
  const activeCategories = Object.entries(trendData.categoriesData)
    .filter(([_, values]) => values.some(v => v > 0))
    .map(([name, _], index) => ({
      name,
      dataKey: `cat_${name}`,
      color: `hsl(${(index * 25) % 360}, 70%, 50%)` // Generate colors with good spacing
    }));

  // Get active locations (those with non-zero values)
  const activeLocations = Object.entries(trendData.locationsData)
    .filter(([_, values]) => values.some(v => v > 0))
    .map(([name, _], index) => ({
      name,
      dataKey: `loc_${name}`,
      color: `hsl(${(index * 25 + 180) % 360}, 70%, 50%)` // Offset colors from categories
    }));

  // Render the chart component based on the current tab and chart type
  const renderChart = (dataKey: string, items: Array<{ name: string; dataKey: string; color: string }>) => {
    if (viewMode === 'table' || !chartInitialized.current) {
      return null; // Table view is handled separately or chart not initialized yet
    }

    try {
      if (chartType === 'line') {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {dataKey === 'total' ? (
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Expenses"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              ) : (
                items.map((item) => (
                  <Line
                    key={item.dataKey}
                    type="monotone"
                    dataKey={item.dataKey}
                    name={item.name}
                    stroke={item.color}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      } else {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {dataKey === 'total' ? (
                <Bar
                  dataKey="total"
                  name="Total Expenses"
                  fill="#7c3aed"
                />
              ) : (
                items.map((item) => (
                  <Bar
                    key={item.dataKey}
                    dataKey={item.dataKey}
                    name={item.name}
                    fill={item.color}
                  />
                ))
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      }
    } catch (error) {
      handleChartError(error as Error);
      return (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-red-500">Error rendering chart. View as table instead.</p>
        </div>
      );
    }
  };

  // Render the table view for the current tab
  const renderTable = (items: Array<{ name: string; dataKey: string }>, tabValue: string) => {
    if (tabValue === 'total') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Month</th>
                <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Total Expenses</th>
              </tr>
            </thead>
            <tbody>
              {trendData.months.map((month, index) => (
                <tr key={month}>
                  <td className="border border-gray-200 dark:border-gray-700 p-2">{formatMonthYear(month)}</td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2">{formatCurrency(trendData.totalsByMonth[index])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Month</th>
                {items.map(item => (
                  <th key={item.dataKey} className="border border-gray-200 dark:border-gray-700 p-2 text-left">{item.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trendData.months.map((month, monthIndex) => (
                <tr key={month}>
                  <td className="border border-gray-200 dark:border-gray-700 p-2">{formatMonthYear(month)}</td>
                  {items.map(item => {
                    const key = item.dataKey.startsWith('cat_')
                      ? item.name
                      : item.name;

                    const values = item.dataKey.startsWith('cat_')
                      ? trendData.categoriesData[item.name]
                      : trendData.locationsData[item.name];

                    return (
                      <td key={`${month}-${key}`} className="border border-gray-200 dark:border-gray-700 p-2">
                        {formatCurrency(values[monthIndex])}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Expense Trends Over Time</CardTitle>
          <div className="flex space-x-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-1 flex">
              <Button
                variant="ghost"
                size="sm"
                className={`px-2 ${viewMode === 'chart' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                onClick={() => setViewMode('chart')}
                title="Chart View"
              >
                {chartType === 'line' ? <LineChartIcon size={16} /> : <BarChart2 size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`px-2 ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <Table2 size={16} />
              </Button>
            </div>
            {viewMode === 'chart' && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-1 flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-2 ${chartType === 'line' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                  onClick={() => setChartType('line')}
                  title="Line Chart"
                >
                  <LineChartIcon size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-2 ${chartType === 'bar' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                  onClick={() => setChartType('bar')}
                  title="Bar Chart"
                >
                  <BarChart2 size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartError && (
          <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
            {chartError}
          </div>
        )}
        <Tabs defaultValue="total" className="w-full">
          <TabsList className="mb-4 grid grid-cols-3 h-auto">
            <TabsTrigger value="total" className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3">Total Expenses</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3">By Category</TabsTrigger>
            <TabsTrigger value="locations" className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3">By Location</TabsTrigger>
          </TabsList>

          <TabsContent value="total" className="pt-2 sm:pt-4">
            {viewMode === 'chart' ? (
              <div className="h-[300px]">
                {renderChart('total', [])}
              </div>
            ) : (
              renderTable([], 'total')
            )}
          </TabsContent>

          <TabsContent value="categories" className="pt-2 sm:pt-4">
            {viewMode === 'chart' ? (
              <div className="h-[300px]">
                {renderChart('categories', activeCategories)}
              </div>
            ) : (
              renderTable(activeCategories, 'categories')
            )}
          </TabsContent>

          <TabsContent value="locations" className="pt-2 sm:pt-4">
            {viewMode === 'chart' ? (
              <div className="h-[300px]">
                {renderChart('locations', activeLocations)}
              </div>
            ) : (
              renderTable(activeLocations, 'locations')
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
