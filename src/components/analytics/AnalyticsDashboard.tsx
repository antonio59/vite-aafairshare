import { useState, useEffect } from 'react';
import { useExpenses } from '../../contexts/ExpenseContext';
import './AnalyticsDashboard.css';

export default function AnalyticsDashboard() {
  const { expenses, loading } = useExpenses();
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [categoryTotals, setCategoryTotals] = useState([]);
  
  useEffect(() => {
    if (!loading && expenses.length > 0) {
      calculateSummary();
    }
  }, [expenses, loading]);

  const calculateSummary = () => {
    // Calculate total expenses
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate category totals
    const categories = {};
    expenses.forEach(expense => {
      if (!categories[expense.category]) {
        categories[expense.category] = 0;
      }
      categories[expense.category] += expense.amount;
    });
    
    // Convert to array and sort by amount
    const categoriesArray = Object.entries(categories).map(([name, amount]) => ({
      name,
      amount,
      percentage: ((amount / total) * 100).toFixed(1)
    }));
    categoriesArray.sort((a, b) => b.amount - a.amount);
    
    setCategoryTotals(categoriesArray);
    
    // Set monthly summary
    setMonthlySummary({
      totalExpenses: total,
      expenseCount: expenses.length,
      averageExpense: total / expenses.length
    });
  };

  if (loading) {
    return <div className="loading-indicator">Loading analytics...</div>;
  }

  if (!monthlySummary) {
    return <div className="no-data">No expense data available for analysis.</div>;
  }

  return (
    <div className="analytics-dashboard">
      <h1>Expense Analytics</h1>
      
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Expenses</h3>
          <p className="amount">£{monthlySummary.totalExpenses.toFixed(2)}</p>
        </div>
        
        <div className="summary-card">
          <h3>Number of Expenses</h3>
          <p className="count">{monthlySummary.expenseCount}</p>
        </div>
        
        <div className="summary-card">
          <h3>Average Expense</h3>
          <p className="amount">£{monthlySummary.averageExpense.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="category-analysis">
        <h2>Spending by Category</h2>
        <div className="category-list">
          {categoryTotals.map(category => (
            <div key={category.name} className="category-item">
              <div className="category-header">
                <span className="category-name">{category.name}</span>
                <span className="category-percentage">{category.percentage}%</span>
              </div>
              <div className="category-bar-container">
                <div 
                  className="category-bar" 
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
              <span className="category-amount">£{category.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}