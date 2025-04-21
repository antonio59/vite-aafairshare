import { ExpenseWithDetails } from '@shared/types';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/dateUtils';

interface ExpenseListProps {
  expenses: ExpenseWithDetails[];
  onEdit: (expense: ExpenseWithDetails) => void;
  onDelete: (expenseId: string) => void;
}

export default function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const handleEdit = (expense: ExpenseWithDetails) => {
    onEdit(expense);
  };

  const handleDelete = async (expenseId: string) => {
    onDelete(expenseId);
  };

  if (!expenses.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No expenses found</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      {expenses.map((expense) => (
        <div key={expense.id} className="expense-item">
          <div className="expense-info">
            <div className="expense-header">
              <h3 className="expense-title">{expense.description}</h3>
              <div className="expense-actions">
                <button
                  onClick={() => handleEdit(expense)}
                  className="edit-button"
                  aria-label="Edit expense"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="delete-button"
                  aria-label="Delete expense"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="expense-details">
              <p className="amount">{formatCurrency(expense.amount)}</p>
              <p className="date">{formatDate(expense.date)}</p>
              <p className="category">{expense.category?.name || 'Uncategorized'}</p>
              <p className="location">{expense.location?.name || 'No location'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 