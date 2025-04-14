import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendData } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonthYear, stringToColor, formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface TrendChartProps {
  trendData?: TrendData;
  isLoading?: boolean;
}

export default function TrendChart({ trendData, isLoading = false }: TrendChartProps) {
  // Removed unused state setter: setActiveTrendType
  // const [activeTrendType, setActiveTrendType] = useState<"categories" | "locations">("categories");

  if (isLoading) {
    return (
      <Card className="border-gray-200">
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
      <Card className="border-gray-200">
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

  // Get active categories (those with data)
  const activeCategories = Object.entries(trendData.categoriesData)
    .filter(([_, values]) => values.some(value => value > 0))
    .map(([category]) => ({
      name: category,
      dataKey: `cat_${category}`,
      color: stringToColor(category),
    }));

  // Get active locations (those with data)
  const activeLocations = Object.entries(trendData.locationsData)
    .filter(([_, values]) => values.some(value => value > 0))
    .map(([location]) => ({
      name: location,
      dataKey: `loc_${location}`,
      color: stringToColor(location),
    }));

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format Y axis ticks as currency
  const formatYAxis = (value: number) => {
    return formatCurrency(value);
  };

  return (
    <Card className="overflow-hidden border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Expense Trends Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="total" className="w-full">
          <TabsList className="mb-4 grid grid-cols-3 h-auto">
            <TabsTrigger value="total" className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3">Total Expenses</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3">By Category</TabsTrigger>
            <TabsTrigger value="locations" className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3">By Location</TabsTrigger>
          </TabsList>
          <TabsContent value="total" className="pt-2 sm:pt-4">
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Expenses"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="categories" className="pt-2 sm:pt-4">
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {activeCategories.map((category, index) => (
                    <Line
                      key={category.dataKey}
                      type="monotone"
                      dataKey={category.dataKey}
                      name={category.name}
                      stroke={category.color}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="locations" className="pt-2 sm:pt-4">
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatYAxis} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {activeLocations.map((location, index) => (
                    <Line
                      key={location.dataKey}
                      type="monotone"
                      dataKey={location.dataKey}
                      name={location.name}
                      stroke={location.color}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
