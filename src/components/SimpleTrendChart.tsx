import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendData } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonthYear, formatCurrency } from "@/lib/utils";

interface SimpleTrendChartProps {
  trendData?: TrendData;
  isLoading?: boolean;
}

export default function SimpleTrendChart({ trendData, isLoading = false }: SimpleTrendChartProps) {
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

  // Create a simple table-based visualization
  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-200 p-2 text-left">Month</th>
                    <th className="border border-gray-200 p-2 text-left">Total Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {trendData.months.map((month, index) => (
                    <tr key={month}>
                      <td className="border border-gray-200 p-2">{formatMonthYear(month)}</td>
                      <td className="border border-gray-200 p-2">{formatCurrency(trendData.totalsByMonth[index])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="pt-2 sm:pt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-200 p-2 text-left">Month</th>
                    {Object.keys(trendData.categoriesData)
                      .filter(category => trendData.categoriesData[category].some(value => value > 0))
                      .map(category => (
                        <th key={category} className="border border-gray-200 p-2 text-left">{category}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {trendData.months.map((month, monthIndex) => (
                    <tr key={month}>
                      <td className="border border-gray-200 p-2">{formatMonthYear(month)}</td>
                      {Object.entries(trendData.categoriesData)
                        .filter(([_, values]) => values.some(value => value > 0))
                        .map(([category, values]) => (
                          <td key={`${month}-${category}`} className="border border-gray-200 p-2">
                            {formatCurrency(values[monthIndex])}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="pt-2 sm:pt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-200 p-2 text-left">Month</th>
                    {Object.keys(trendData.locationsData)
                      .filter(location => trendData.locationsData[location].some(value => value > 0))
                      .map(location => (
                        <th key={location} className="border border-gray-200 p-2 text-left">{location}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {trendData.months.map((month, monthIndex) => (
                    <tr key={month}>
                      <td className="border border-gray-200 dark:border-gray-700 p-2">{formatMonthYear(month)}</td>
                      {Object.entries(trendData.locationsData)
                        .filter(([_, values]) => values.some(value => value > 0))
                        .map(([location, values]) => (
                          <td key={`${month}-${location}`} className="border border-gray-200 dark:border-gray-700 p-2">
                            {formatCurrency(values[monthIndex])}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
