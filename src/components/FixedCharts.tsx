import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EnhancedDataChart from './EnhancedDataChart';
import EnhancedTrendChart from './EnhancedTrendChart';
import SimpleDataTable from './SimpleDataTable';
import SimpleTrendChart from './SimpleTrendChart';

interface DataChartProps {
  title: string;
  data: Array<{ name: string; value: number; percentage?: number }>;
  valueFormatter: (value: number) => string;
  height?: number;
  isLoading?: boolean;
  customColorFunction?: (name: string) => string;
  enableCharts: boolean;
}

export function FixedDataChart(props: DataChartProps) {
  const { title, data, valueFormatter, height, isLoading, customColorFunction, enableCharts } = props;

  // Always render the table first
  const tableView = (
    <SimpleDataTable
      title={title}
      data={data}
      valueFormatter={valueFormatter}
      height={height}
      customColorFunction={customColorFunction}
    />
  );

  // If charts are enabled, try to render the chart
  if (enableCharts) {
    try {
      return (
        <div>
          <div className="mb-4">
            {tableView}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Chart View</h3>
            <EnhancedDataChart
              title={title}
              data={data}
              valueFormatter={valueFormatter}
              height={height || 300}
              isLoading={isLoading}
              customColorFunction={customColorFunction}
            />
          </div>
        </div>
      );
    } catch (error) {
      console.error('Chart error:', error);
      return tableView;
    }
  } else {
    return tableView;
  }
}

interface TrendChartProps {
  title: string;
  trendData: any;
  isLoading?: boolean;
  enableCharts: boolean;
}

export function FixedTrendChart(props: TrendChartProps) {
  const { title, trendData, isLoading, enableCharts } = props;

  if (!trendData || !trendData.months || trendData.months.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No trend data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Always render the table view first
  const tableView = (
    <SimpleTrendChart trendData={trendData} isLoading={isLoading} />
  );

  // If charts are enabled, try to render the chart
  if (enableCharts) {
    try {
      return (
        <div>
          <div className="mb-4">
            {tableView}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Chart View</h3>
            <EnhancedTrendChart
              trendData={trendData}
              isLoading={isLoading}
            />
          </div>
        </div>
      );
    } catch (error) {
      console.error('Chart error:', error);
      return tableView;
    }
  } else {
    return tableView;
  }
}
