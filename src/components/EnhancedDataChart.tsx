import React, { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PieChart as PieChartIcon, BarChart2, Table2 } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

interface DataItem {
  name: string;
  value: number;
  percentage?: number;
}

interface EnhancedDataChartProps {
  title: string;
  data: DataItem[];
  valueFormatter: (value: number) => string;
  height?: number;
  isLoading?: boolean;
  customColors?: Record<string, string>;
  customColorFunction?: (name: string) => string;
}

// Custom tooltip component for better formatting
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
        <p className="font-medium text-gray-900 dark:text-gray-100">{payload[0].name}</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center">
            <div
              className="w-3 h-3 mr-2 rounded-full"
              style={{ backgroundColor: payload[0].color }}
            />
            <span className="text-gray-700 dark:text-gray-300">Amount: </span>
            <span className="ml-1 font-medium">{formatCurrency(payload[0].value as number)}</span>
          </div>
          {payload[0].payload.percentage !== undefined && (
            <div className="flex items-center">
              <div className="w-3 h-3 mr-2 opacity-0" />
              <span className="text-gray-700 dark:text-gray-300">Percentage: </span>
              <span className="ml-1 font-medium">{payload[0].payload.percentage.toFixed(1)}%</span>
            </div>
          )}
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

// Custom label for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default function EnhancedDataChart({
  title,
  data,
  valueFormatter,
  height = 300,
  isLoading = false,
  customColors = {},
  customColorFunction
}: EnhancedDataChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [chartError, setChartError] = useState<string | null>(null);
  const chartInitialized = useRef<boolean>(false);

  // Initialize chart only after component is mounted
  useEffect(() => {
    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      chartInitialized.current = true;
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      chartInitialized.current = false;
    };
  }, []);

  // Error handler for chart rendering
  const handleChartError = useCallback((error: Error) => {
    console.error("Chart rendering error:", error);
    setChartError("Failed to render chart. Showing table view instead.");
    setViewMode('table');
  }, []);

  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Generate colors for chart items, using customColorFunction or customColors if provided
  const COLORS = sortedData.map((item, index) => {
    if (customColorFunction) {
      return customColorFunction(item.name);
    }
    return customColors[item.name] || `hsl(${(index * 25) % 360}, 70%, 50%)`;
  });

  if (isLoading) {
    return (
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render the chart based on the selected type
  const renderChart = () => {
    if (viewMode === 'table' || !chartInitialized.current) {
      return null; // Table view is handled separately or chart not initialized yet
    }

    try {
      if (chartType === 'pie') {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      } else {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatYAxis} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="Amount">
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
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

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="flex space-x-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-1 flex">
              <Button
                variant="ghost"
                size="sm"
                className={`px-2 ${viewMode === 'chart' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                onClick={() => setViewMode('chart')}
                title="Chart View"
              >
                {chartType === 'pie' ? <PieChartIcon size={16} /> : <BarChart2 size={16} />}
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
                  className={`px-2 ${chartType === 'pie' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                  onClick={() => setChartType('pie')}
                  title="Pie Chart"
                >
                  <PieChartIcon size={16} />
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
        {viewMode === 'chart' ? (
          <div className="h-[300px]">
            {renderChart()}
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ minHeight: `${height - 100}px` }}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Name</th>
                  <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Amount</th>
                  {sortedData.some(item => item.percentage !== undefined) && (
                    <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Percentage</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td className="border border-gray-200 dark:border-gray-700 p-2">{item.name}</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-2">{valueFormatter(item.value)}</td>
                    {sortedData.some(item => item.percentage !== undefined) && (
                      <td className="border border-gray-200 dark:border-gray-700 p-2">
                        {item.percentage !== undefined ? `${item.percentage.toFixed(1)}%` : '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
