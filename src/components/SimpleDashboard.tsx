import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { MonthSummary, Expense, ExpenseWithDetails } from "@shared/schema";

interface SimpleDashboardProps {
  summary?: MonthSummary;
  expenses?: Expense[];
  isLoading: boolean;
  currentMonth: string;
}

export default function SimpleDashboard({
  summary,
  expenses,
  isLoading,
  currentMonth
}: SimpleDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Dashboard - {currentMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-gray-200 p-4">
              <h3 className="text-lg font-medium mb-2">Total Expenses</h3>
              <p className="text-2xl font-bold text-primary">
                {summary ? formatCurrency(summary.totalExpenses) : "$0.00"}
              </p>
            </Card>

            <Card className="border-gray-200 p-4">
              <h3 className="text-lg font-medium mb-2">Settlement Amount</h3>
              <p className="text-2xl font-bold text-primary">
                {summary ? formatCurrency(summary.settlementAmount) : "$0.00"}
              </p>
            </Card>
          </div>

          <h3 className="text-lg font-medium mb-4">Recent Expenses</h3>
          {expenses && expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-200 p-2 text-left">Date</th>
                    <th className="border border-gray-200 p-2 text-left">Description</th>
                    <th className="border border-gray-200 p-2 text-left">Amount</th>
                    <th className="border border-gray-200 p-2 text-left">Category</th>
                    <th className="border border-gray-200 p-2 text-left">Paid By</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 5).map((expense) => (
                    <tr key={expense.id}>
                      <td className="border border-gray-200 p-2">
                        {expense.date instanceof Date
                          ? expense.date.toLocaleDateString()
                          : new Date((expense.date as any)?.seconds * 1000).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-200 p-2">{expense.description}</td>
                      <td className="border border-gray-200 p-2">{formatCurrency(expense.amount)}</td>
                      <td className="border border-gray-200 p-2">{(expense as any).category?.name || 'Uncategorized'}</td>
                      <td className="border border-gray-200 p-2">{(expense as ExpenseWithDetails).paidByUser?.username || (expense as ExpenseWithDetails).paidByUser?.email?.split('@')[0] || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No expenses found for this month.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
