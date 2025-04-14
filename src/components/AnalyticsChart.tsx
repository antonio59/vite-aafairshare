import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PieChart as PieChartIcon, BarChart2, LineChart, Table2 } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

/**
 * DataChart Component for displaying simple data series in various formats
 */
export interface DataItem {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface DataChartProps {
  title: string;
  data: DataItem[];
  valueFormatter?: (value: number) => string;
  height?: number;
  isLoading?: boolean;
  getItemColor?: (name: string, index: number) => string;
  emptyMessage?: string;
}

export function DataChart({
  title,
  data,
  valueFormatter = formatCurrency,
  height = 300,
  isLoading = false,
  getItemColor = (_, index) => `hsl(${(index * 25) % 360}, 70%, 50%)`,
  emptyMessage = "No data available"
}: DataChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // Apply colors to the data items
  const colorizedData = sortedData.map((item, index) => ({
    ...item,
    color: item.color || getItemColor(item.name, index)
  }));

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
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
              <span className="ml-1 font-medium">{valueFormatter(payload[0].value as number)}</span>
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

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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

  // Y-axis formatter for bar charts
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return `${value}`;
  };

  // Render chart based on the selected type
  const renderChart = () => {
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={colorizedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={height / 3}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {colorizedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={colorizedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatYAxis} />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" name="Amount">
              {colorizedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      );
    }
  };

  // Render table view
  const renderTable = () => (
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
          {colorizedData.map((item, index) => (
            <tr key={`${item.name}-${index}`}>
              <td className="border border-gray-200 dark:border-gray-700 p-2">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </td>
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
  );

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700 h-full">
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
        <div className="h-full">
          {viewMode === 'chart' ? renderChart() : renderTable()}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * TrendChart Component for displaying time series data
 */
export interface TrendChartProps {
  title: string;
  data: {
    months: string[];
    series: Array<{
      name: string;
      data: number[];
      color?: string;
    }>;
  };
  valueFormatter?: (value: number) => string;
  xAxisFormatter?: (value: string) => string;
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function TrendChart({
  title,
  data,
  valueFormatter = formatCurrency,
  xAxisFormatter = (x) => x,
  height = 300,
  isLoading = false,
  emptyMessage = "No trend data available"
}: TrendChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.months || data.months.length === 0 || !data.series || data.series.length === 0) {
    return (
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for recharts
  const chartData = data.months.map((month, i) => {
    const dataPoint: Record<string, any> = {
      month: xAxisFormatter(month),
    };
    
    // Add each series data point
    data.series.forEach(series => {
      dataPoint[series.name] = series.data[i] || 0;
    });
    
    return dataPoint;
  });

  // Custom tooltip for trend charts
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
                <span className="ml-1 font-medium">{valueFormatter(entry.value as number)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Y-axis formatter
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return `${value}`;
  };

  // Render chart based on the selected type
  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {data.series.map((series, index) => (
              <Line
                key={`line-${series.name}`}
                type="monotone"
                dataKey={series.name}
                stroke={series.color || `hsl(${(index * 25) % 360}, 70%, 50%)`}
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {data.series.map((series, index) => (
              <Bar
                key={`bar-${series.name}`}
                dataKey={series.name}
                fill={series.color || `hsl(${(index * 25) % 360}, 70%, 50%)`}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      );
    }
  };

  // Render table view
  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Month</th>
            {data.series.map(series => (
              <th key={`header-${series.name}`} className="border border-gray-200 dark:border-gray-700 p-2 text-left">
                {series.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.months.map((month, monthIndex) => (
            <tr key={month}>
              <td className="border border-gray-200 dark:border-gray-700 p-2">{xAxisFormatter(month)}</td>
              {data.series.map(series => (
                <td key={`${month}-${series.name}`} className="border border-gray-200 dark:border-gray-700 p-2">
                  {valueFormatter(series.data[monthIndex] || 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700 h-full">
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
                {chartType === 'line' ? <LineChart size={16} /> : <BarChart2 size={16} />}
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
                  <LineChart size={16} />
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
        {viewMode === 'chart' ? renderChart() : renderTable()}
      </CardContent>
    </Card>
  );
} 