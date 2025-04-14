import { Settlement as SettlementType, User } from "@shared/schema"; // Import base Settlement and User types
import {
  Card,
  CardContent,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
// Removed format import from date-fns
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils"; // Added formatDate, formatMonthYear
import { Skeleton } from "@/components/ui/skeleton";

interface SettlementHistoryProps {
  settlements: SettlementType[]; // Use base Settlement type
  users: User[]; // Add users prop for lookup
  isLoading?: boolean;
  onUnsettlement?: (id: string) => void; // ID is now string
}

export default function SettlementHistory(props: SettlementHistoryProps) {
  const { settlements, users, isLoading = false, onUnsettlement } = props;

  // Helper to get username from ID
  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.username || user?.email?.split('@')[0] || `User...`; // Fallback logic
  };

  // Display loading state
  if (isLoading) {
    return (
      <Card className="border-gray-200"> {/* Added border class */}
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display empty state
  if (settlements.length === 0) {
    return (
      <Card className="border-gray-200"> {/* Added border class */}
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-gray-600">No settlements recorded yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200"> {/* Added border class */}
      <CardHeader>
        <CardTitle>Settlement History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 sm:hidden">
          {settlements.map((settlement) => (
            <div key={settlement.id} className="bg-white p-4 rounded-lg border">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-sm font-medium">{formatDate(settlement.date)}</p> {/* Use formatDate */}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Month</p>
                  <p className="text-sm font-medium">{formatMonthYear(settlement.month)}</p> {/* Use formatMonthYear */}
                </div>
                <div>
                  <p className="text-sm text-gray-500">From</p>
                  <p className="text-sm font-medium">{getUserName(settlement.fromUserId)}</p> {/* Lookup username */}
                </div>
                <div>
                  <p className="text-sm text-gray-500">To</p>
                  <p className="text-sm font-medium">{getUserName(settlement.toUserId)}</p> {/* Lookup username */}
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-sm font-medium">{formatCurrency(Number(settlement.amount))}</p>
                </div>
                {onUnsettlement && (
                  <div className="col-span-2 mt-2 flex justify-end">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => onUnsettlement(settlement.id)} // Pass string ID
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Settlement
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {onUnsettlement && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((settlement) => (
                <TableRow key={settlement.id}>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(settlement.date)} {/* Use formatDate */}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatMonthYear(settlement.month)} {/* Use formatMonthYear */}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-800">
                    {getUserName(settlement.fromUserId)} {/* Lookup username */}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-800">
                    {getUserName(settlement.toUserId)} {/* Lookup username */}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-800 text-right">
                    {formatCurrency(Number(settlement.amount))}
                  </TableCell>
                  {onUnsettlement && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUnsettlement(settlement.id)} // Pass string ID
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
