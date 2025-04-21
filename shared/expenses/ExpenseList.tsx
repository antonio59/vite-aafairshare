import { useState } from 'react';
import { useExpenses } from '@/contexts/ExpenseContext';
import type { ExpenseWithDetails } from '@shared/types';
import ExpenseForm from './ExpenseForm';

export default function ExpenseList() {
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { _expenses, loading, deleteExpense } = useExpenses();

  const handleEdit = (expense: ExpenseWithDetails) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(expenseId);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setEditingExpense(null);
    setShowForm(false);
  };

  if (loading) {
    return <div>Loading _expenses...</div>;
  }

  return (
    <div className="expense-list-container">
      <div className="expense-list-header">
        <h2>Your Expenses</h2>
        <button onClick={() => setShowForm(true)}>Add New Expense</button>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <ExpenseForm
              expense={editingExpense}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}

      {_expenses.length === 0 ? (
        <p>No _expenses found. Start by adding a new expense!</p>
      ) : (
        <div className="expense-list">
          {_expenses.map((expense: ExpenseWithDetails) => (
            <div key={expense.id} className="expense-item">
              <div className="expense-details">
                <h3>{expense.description}</h3>
                <p className="category">{typeof expense.category === 'object' && expense.category ? expense.category.name : expense.category}</p>
                <p className="amount">${expense.amount.toFixed(2)}</p>
                <p className="date">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
              <div className="expense-actions">
                <button
                  onClick={() => handleEdit(expense)}
                  className="edit-button"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}