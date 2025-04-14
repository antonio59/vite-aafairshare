import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart2, 
  LineChart as LineChartIcon, 
  LayoutPanelTop, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Chart type options
type ChartType = 'bar' | 'line' | 'composed';

interface ComparisonChartProps {
  title: string;
  data: any[];
  series: Array<{
    name: string;
    dataKey: string;
    color: string;
  }>;
  xAxisKey: string;
  valueFormatter?: (value: number) => string;
  showControls?: boolean;
  initialChartType?: ChartType;
  height?: number;
}

export function ComparisonChart({
  title,
  data,
  series,
  xAxisKey,
  valueFormatter = (value) => `${value}`,
  showControls = true,
  initialChartType = 'bar',
  height = 400,
}: ComparisonChartProps) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Custom tooltip formatter
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {valueFormatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render the appropriate chart based on type
  const renderChart = () => {
    const chartHeight = height * zoomLevel;

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip content={customTooltip} />
              <Legend />
              {series.map((s, index) => (
                <Line
                  key={`line-${index}`}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip content={customTooltip} />
              <Legend />
              {series.map((s, index) => {
                // Alternate between different chart types for better visualization
                if (index % 3 === 0) {
                  return (
                    <Bar
                      key={`bar-${index}`}
                      dataKey={s.dataKey}
                      name={s.name}
                      fill={s.color}
                      barSize={20}
                    />
                  );
                } else if (index % 3 === 1) {
                  return (
                    <Line
                      key={`line-${index}`}
                      type="monotone"
                      dataKey={s.dataKey}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={2}
                    />
                  );
                } else {
                  return (
                    <Area
                      key={`area-${index}`}
                      type="monotone"
                      dataKey={s.dataKey}
                      name={s.name}
                      fill={s.color}
                      stroke={s.color}
                      fillOpacity={0.3}
                    />
                  );
                }
              })}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip content={customTooltip} />
              <Legend />
              {series.map((s, index) => (
                <Bar
                  key={`bar-${index}`}
                  dataKey={s.dataKey}
                  name={s.name}
                  fill={s.color}
                  barSize={20}
                />
              ))}
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
              onClick={() => setChartType('composed')}
              aria-label="Composed chart"
              aria-pressed={chartType === 'composed'}
              className={chartType === 'composed' ? 'bg-primary/10' : ''}
            >
              <LayoutPanelTop className="h-4 w-4" />
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
