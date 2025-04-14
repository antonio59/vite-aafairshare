import { useState } from 'react';
import { useExpenses } from '../../contexts/ExpenseContext';
import ExpenseForm from './ExpenseForm';

export default function ExpenseList() {
  const [editingExpense, setEditingExpense] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { expenses, loading, deleteExpense } = useExpenses();

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (expenseId) => {
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
    return <div>Loading expenses...</div>;
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

      {expenses.length === 0 ? (
        <p>No expenses found. Start by adding a new expense!</p>
      ) : (
        <div className="expense-list">
          {expenses.map(expense => (
            <div key={expense.id} className="expense-item">
              <div className="expense-details">
                <h3>{expense.description}</h3>
                <p className="category">{expense.category}</p>
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