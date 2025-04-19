import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Sector,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// Chart type options
type ChartType = 'bar' | 'pie' | 'line';

// Color palette for charts
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FF6B6B', '#6A7FDB', '#61DAFB', '#F28482',
];

interface EnhancedChartProps {
  title: string;
  data: unknown[];
  dataKey: string;
  nameKey: string;
  // eslint-disable-next-line no-unused-vars
  valueFormatter?: (value: number) => string;
  categoryColors?: Record<string, string>;
  showControls?: boolean;
  initialChartType?: ChartType;
  height?: number;
}

export function EnhancedChart({
  title,
  data,
  dataKey,
  nameKey,
  valueFormatter = (value: number) => `${value}`,
  categoryColors = {},
  showControls = true,
  initialChartType = 'bar',
  height = 400,
}: EnhancedChartProps) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Handle pie chart active sector
  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Custom tooltip formatter
  const customTooltip = ({ active, payload }: { active?: boolean; payload?: unknown[] }) => {
    if (active && Array.isArray(payload) && payload.length) {
      const item = payload[0] as { payload?: unknown; value?: unknown };
      const itemPayload = (item.payload && typeof item.payload === 'object') ? item.payload as Record<string, unknown> : {};
      const name = itemPayload[nameKey];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-medium">{typeof name === 'string' ? name : ''}</p>
          <p className="text-primary">
            {typeof item.value === 'number' ? valueFormatter(item.value) : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // Render active shape for pie chart (for interactive hover effect)
  const renderActiveShape = (props: unknown) => {
    // Always return a valid React element (never null)
    if (!props || typeof props !== 'object') {
      return <g />;
    }
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props as Record<string, unknown>;
    const safePayload = (payload && typeof payload === 'object' && typeof nameKey === 'string') ? payload as Record<string, unknown> : {};
    const name = typeof nameKey === 'string' ? safePayload[nameKey] : undefined;
    return (
      <g>
        <text x={cx as number} y={cy as number} dy={-20} textAnchor="middle" fill={fill as string} className="text-sm">
          {typeof name === 'string' ? name : ''}
        </text>
        <text x={cx as number} y={cy as number} dy={0} textAnchor="middle" fill={fill as string} className="text-lg font-medium">
          {typeof value === 'number' ? valueFormatter(value) : ''}
        </text>
        <text x={cx as number} y={cy as number} dy={20} textAnchor="middle" fill={fill as string} className="text-xs">
          {typeof percent === 'number' ? `${(percent * 100).toFixed(1)}%` : ''}
        </text>
        <Sector
          cx={cx as number}
          cy={cy as number}
          innerRadius={innerRadius as number}
          outerRadius={typeof outerRadius === 'number' ? outerRadius + 10 : undefined}
          startAngle={startAngle as number}
          endAngle={endAngle as number}
          fill={fill as string}
        />
        <Sector
          cx={cx as number}
          cy={cy as number}
          startAngle={startAngle as number}
          endAngle={endAngle as number}
          innerRadius={typeof innerRadius === 'number' ? innerRadius - 5 : undefined}
          outerRadius={outerRadius as number}
          fill={fill as string}
        />
      </g>
    );
  };

  // Get color for a data item
  const getItemColor = (item: unknown, index: number) => {
    if (item && typeof item === 'object' && typeof nameKey === 'string') {
      const key = (item as Record<string, unknown>)[nameKey];
      if (typeof key === 'string') {
        return categoryColors[key] || COLORS[index % COLORS.length];
      }
    }
    return COLORS[index % COLORS.length];
  };

  // Render the appropriate chart based on type
  const renderChart = () => {
    const chartHeight = height * zoomLevel;

    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey={dataKey}
                nameKey={nameKey}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getItemColor(entry, index)} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip content={customTooltip} />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip content={customTooltip} />
              <Legend />
              <Bar dataKey={dataKey}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getItemColor(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        {showControls && (
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setChartType('bar')}
              aria-label="Bar chart"
              aria-pressed={chartType === 'bar'}
              className={chartType === 'bar' ? 'bg-primary/10' : ''}
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setChartType('pie')}
              aria-label="Pie chart"
              aria-pressed={chartType === 'pie'}
              className={chartType === 'pie' ? 'bg-primary/10' : ''}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setChartType('line')}
              aria-label="Line chart"
              aria-pressed={chartType === 'line'}
              className={chartType === 'line' ? 'bg-primary/10' : ''}
            >
              <LineChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoomLevel(Math.min(zoomLevel + 0.5, 2))}
              aria-label="Zoom in"
              disabled={zoomLevel >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoomLevel(Math.max(zoomLevel - 0.5, 0.5))}
              aria-label="Zoom out"
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setChartType(initialChartType);
                setZoomLevel(1);
              }}
              aria-label="Reset view"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
