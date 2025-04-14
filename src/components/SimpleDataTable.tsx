import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SimpleDataTableProps {
  title: string;
  data: Array<{ name: string; value: number; percentage?: number }>;
  valueFormatter: (value: number) => string;
  height?: number;
  customColors?: Record<string, string>;
  customColorFunction?: (name: string) => string;
}

export default function SimpleDataTable({
  title,
  data,
  valueFormatter,
  height = 350,
  customColors = {},
  customColorFunction
}: SimpleDataTableProps) {
  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
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
                  <td className="border border-gray-200 dark:border-gray-700 p-2">
                    {(customColorFunction || customColors[item.name]) && (
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: customColorFunction ? customColorFunction(item.name) : customColors[item.name] }}
                      />
                    )}
                    {item.name}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 p-2">{valueFormatter(item.value)}</td>
                  {sortedData.some(item => item.percentage !== undefined) && (
                    <td className="border border-gray-200 dark:border-gray-700 p-2">
                      {item.percentage !== undefined ? `${item.percentage.toFixed(1)}%` : ''}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
