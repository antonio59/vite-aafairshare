import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/NewAuthContext';
import { ExpenseWithDetails } from '@shared/types';
import { useExpenses } from '@/contexts/ExpenseContext';
import './SettlementsPage.css';

// Add types for settlements and summary
interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: Date;
  month: string;
  status: string;
}
interface MonthSummary {
  month: string;
  totalExpenses: number;
  userExpenses: Record<string, number>;
}

export default function SettlementsPage() {
  const { currentUser } = useAuth();
  const { _expenses, loading: expensesLoading } = useExpenses();
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth());
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch settlements from database
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSettlements = async () => {
      try {
        // In a real implementation, this would fetch settlements from Supabase
        // For now, we'll use mock data
        setSettlements([]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching settlements:', error);
        setLoading(false);
      }
    };
    
    fetchSettlements();
  }, [currentUser, currentMonth]);
  
  // Calculate settlement summary when expenses change
  useEffect(() => {
    if (expensesLoading || !_expenses.length || !currentUser) {
      setSummary(null);
      return;
    }
    
    // Filter expenses for the current month
    const monthlyExpenses = _expenses.filter((expense: ExpenseWithDetails) => {
      // Use type guard for month property
      const expenseMonth = 'month' in expense && expense.month ? expense.month : getMonthFromDate(expense.date);
      return expenseMonth === currentMonth;
    });
    
    if (monthlyExpenses.length === 0) {
      setSummary(null);
      return;
    }
    
    // Calculate total expenses
    const totalExpenses = monthlyExpenses.reduce((sum: number, expense: ExpenseWithDetails) => sum + expense.amount, 0);
    
    // In a real app, we would calculate per-user expenses
    // For now, we'll use a simplified model
    setSummary({
      month: currentMonth,
      totalExpenses,
      userExpenses: {
        [currentUser.uid]: totalExpenses
      }
    });
  }, [_expenses, expensesLoading, currentMonth, currentUser]);
  
  const handleMonthChange = (newMonth: string) => {
    setCurrentMonth(newMonth);
  };
  
  const handleCreateSettlement = () => {
    setIsDialogOpen(true);
  };
  
  const handleSettlementConfirm = async () => {
    if (!currentUser || !summary) return;
    try {
      const newSettlement: Settlement = {
        id: `settlement-${Date.now()}`,
        fromUserId: currentUser.uid,
        toUserId: 'other-user-id',
        amount: summary.totalExpenses / 2,
        date: new Date(),
        month: currentMonth,
        status: 'completed'
      };
      setSettlements([newSettlement, ...settlements]);
      setIsDialogOpen(false);
      console.log('Settlement created, emails would be sent to both users');
    } catch (error) {
      console.error('Error creating settlement:', error);
    }
  };
  
  const handleUnsettlement = async (settlementId: string) => {
    try {
      setSettlements(settlements.filter(s => s.id !== settlementId));
    } catch (error) {
      console.error('Error deleting settlement:', error);
    }
  };
  
  // Helper functions
  function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  
  function getMonthFromDate(date: string | Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  
  function formatMonthYear(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }
  
  if (loading || expensesLoading) {
    return <div className="loading-indicator">Loading settlements...</div>;
  }
  
  return (
    <div className="settlements-container">
      <h1>Settlements</h1>
      
      <div className="month-selector">
        <button onClick={() => handleMonthChange(getPreviousMonth(currentMonth))}>
          &lt; Previous
        </button>
        <h2>{formatMonthYear(currentMonth)}</h2>
        <button 
          onClick={() => handleMonthChange(getCurrentMonth())}
          disabled={currentMonth === getCurrentMonth()}
        >
          Current &gt;
        </button>
      </div>
      
      {summary ? (
        <div className="settlement-summary">
          <div className="summary-card">
            <h3>Total Expenses</h3>
            <p className="amount">{formatCurrency(summary.totalExpenses)}</p>
            <button 
              className="create-settlement-button"
              onClick={handleCreateSettlement}
              disabled={settlements.length > 0}
            >
              {settlements.length > 0 ? 'Already Settled' : 'Create Settlement'}
            </button>
          </div>
        </div>
      ) : (
        <div className="no-data">No expenses found for {formatMonthYear(currentMonth)}.</div>
      )}
      
      {settlements.length > 0 && (
        <div className="settlement-history">
          <h2>Settlement History</h2>
          <div className="settlements-list">
            {settlements.map(settlement => (
              <div key={settlement.id} className="settlement-item">
                <div className="settlement-details">
                  <p className="settlement-date">
                    {new Date(settlement.date).toLocaleDateString()}
                  </p>
                  <p className="settlement-amount">
                    {formatCurrency(settlement.amount)}
                  </p>
                  <p className="settlement-status">
                    {settlement.status}
                  </p>
                </div>
                <div className="settlement-actions">
                  <button
                    onClick={() => handleUnsettlement(settlement.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isDialogOpen && summary && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Settlement</h2>
            <p>This will create a settlement for {formatMonthYear(currentMonth)}.</p>
            <p>Total amount: {formatCurrency(summary.totalExpenses)}</p>
            <p>Each person pays: {formatCurrency(summary.totalExpenses / 2)}</p>
            <p>An email notification will be sent to both users.</p>
            <div className="modal-actions">
              <button onClick={() => setIsDialogOpen(false)}>Cancel</button>
              <button onClick={handleSettlementConfirm} className="confirm-button">
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Helper function to get previous month
  function getPreviousMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}