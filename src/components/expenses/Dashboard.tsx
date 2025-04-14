import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useExpenses } from '../../contexts/ExpenseContext';
import { ExpenseWithDetails, User } from '../../types/expense';
import { getCategoryColorClass } from '../../lib/utils';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<any>;
}

// Firestore timestamp format
interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { currentUser } = useAuth() as AuthContextType;
  const { expenses, loading } = useExpenses();

  // Filter expenses by current month
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const filteredExpenses = expenses.filter(expense => expense.month === currentMonthKey);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const calculateTotals = () => {
    if (!filteredExpenses.length || !currentUser) {
      return { total: 0, userPaid: 0, settlement: 0 };
    }
    
    const total = filteredExpenses.reduce((sum: number, expense: ExpenseWithDetails) => sum + (expense.amount || 0), 0);
    const userPaid = filteredExpenses
      .filter((expense: ExpenseWithDetails) => expense.paidByUserId === currentUser?.uid)
      .reduce((sum: number, expense: ExpenseWithDetails) => sum + (expense.amount || 0), 0);
    
    // Calculate settlement based on split type
    let userShare = 0;
    filteredExpenses.forEach(expense => {
      if (expense.splitType === '50/50') {
        userShare += expense.amount / 2;
      } else if (expense.splitType === '100%') {
        if (expense.paidByUserId === currentUser.uid) {
          userShare += expense.amount;
        }
      }
    });
    
    // Settlement amount is what user is owed or owes
    const settlement = userPaid - userShare;

    return {
      total,
      userPaid,
      settlement
    };
  };

  const totals = calculateTotals();

  if (loading) {
    return <div className="p-4 text-center">Loading expenses...</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigateMonth(-1)}>&lt;</button>
        <h2 className="text-xl font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => navigateMonth(1)}>&gt;</button>
        <div className="flex gap-4">
          <button className="text-gray-600">
            <span className="sr-only">Download</span>
            ↓
          </button>
          <button className="text-blue-600">
            <span className="sr-only">Add Expense</span>
            +
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">You Paid</div>
          <div className="text-2xl font-bold">{formatCurrency(totals.userPaid)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Partner Paid</div>
          <div className="text-2xl font-bold">{formatCurrency(totals.total - totals.userPaid)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">
            {totals.settlement > 0 ? 'You are owed' : 'You owe'}
          </div>
          <div className="text-2xl font-bold">{formatCurrency(Math.abs(totals.settlement))}</div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Split</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExpenses && filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense: ExpenseWithDetails) => {
                // Parse date from Firestore format
                let expenseDate = new Date();
                if (expense.date) {
                  // Check if date is a Firestore timestamp object
                  const firestoreDate = expense.date as unknown as FirestoreTimestamp;
                  if (firestoreDate && typeof firestoreDate._seconds === 'number') {
                    expenseDate = new Date(firestoreDate._seconds * 1000);
                  } else {
                    // Handle if it's a regular date object or string
                    expenseDate = new Date(expense.date);
                  }
                }
                
                return (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expenseDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColorClass(expense.category?.name || 'Other')}`}>
                      {expense.category?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.location?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.paidByUserId === currentUser?.uid ? 'You' : 'Partner'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.splitType || '50/50'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.description || ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatCurrency(expense.amount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              )})
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No expenses found for this month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;