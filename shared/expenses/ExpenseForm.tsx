import React from 'react';
import { useState, useEffect, useRef } from 'react';
// TODO: Update the import path for useExpenses to the correct location in your project
// import { useExpenses } from '@/contexts/ExpenseContext';
import { useAuth } from '@/contexts/NewAuthContext';
import { ResourcesService } from "@/services/resources.service";
import { ExpenseWithDetails, Category, Location, User } from '@shared/types';
import './ExpenseForm.css';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

interface ExpenseFormProps {
  expense?: ExpenseWithDetails | null;
  onClose: () => void;
}

export default function ExpenseForm({ expense = null, onClose }: ExpenseFormProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [date, setDate] = useState<Date>(expense?.date ? new Date(expense.date) : new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [splitType, setSplitType] = useState<'50/50' | '100%'>(expense?.splitType || '50/50');
  const formRef = useRef(null);
  
  const { currentUser } = useAuth() as AuthContextType;
  // TODO: Update the import path for useExpenses to the correct location in your project
  // const { addExpense, updateExpense } = useExpenses();

  useEffect(() => {
    if (expense) {
      setDescription(expense.description || '');
      setAmount(expense.amount?.toString() || '');
      setSelectedCategory(expense.category || null);
      setDate(expense.date ? new Date(expense.date) : new Date());
      setSelectedLocation(expense.location || null);
      setSplitType(expense.splitType || '50/50');
    }
  }, [expense]);
  
  // Fetch categories and locations from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setCategoriesLoading(true);
        setLocationsLoading(true);
        const categoriesData = await ResourcesService.getCategories();
        setCategories(categoriesData);
        setCategoriesLoading(false);
        const locationsData = await ResourcesService.getLocations();
        setLocations(locationsData);
        setLocationsLoading(false);
      } catch (error) {
        console.error('Error loading form data:', error);
        setCategoriesLoading(false);
        setLocationsLoading(false);
      }
    };
    loadData();
  }, []);
  
  // Update selected category and location when data is loaded
  useEffect(() => {
    if (categories.length > 0) {
      if (expense?.categoryId) {
        const category = categories.find(c => c.id === expense.categoryId);
        if (category) {
          setSelectedCategory(category);
        } else if (categories[0]) {
          console.warn(`Category with ID ${expense.categoryId} not found, using default`);
          setSelectedCategory(categories[0]);
        }
      } else if (categories[0]) {
        setSelectedCategory(categories[0]);
      }
    }
  }, [categories, expense?.categoryId]);

  useEffect(() => {
    if (locations.length > 0) {
      if (expense?.locationId) {
        const location = locations.find(l => l.id === expense.locationId);
        if (location) {
          setSelectedLocation(location);
        } else if (locations[0]) {
          console.warn(`Location with ID ${expense.locationId} not found, using default`);
          setSelectedLocation(locations[0]);
        }
      } else if (locations[0]) {
        setSelectedLocation(locations[0]);
      }
    }
  }, [locations, expense?.locationId]);
  
  // Split type options
  const splitTypes: Array<'50/50' | '100%'> = ['50/50', '100%'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!amount || !selectedCategory || !selectedLocation || !currentUser) {
      return setError('Please fill in all required fields');
    }

    // TODO: Re-integrate expenseData logic when the correct context is available

    try {
      setError('');
      setLoading(true);
      
      if (expense) {
        // TODO: Update the import path for useExpenses to the correct location in your project
        // await updateExpense(expense.id, expenseData);
      } else {
        // TODO: Update the import path for useExpenses to the correct location in your project
        // await addExpense(expenseData as Expense);
      }
      
      onClose();
    } catch (error: unknown) {
      console.error('Error saving expense:', error);
      setError('Failed to save expense: ' + (error as string));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="expense-form-container">
      <h2>{expense ? 'Edit Expense' : 'Add New Expense'}</h2>
      {error && <div className="error-message">{error}</div>}
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Amount (£)</label>
            <div className="input-with-icon">
              <span className="input-icon">£</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => setDate(new Date(e.target.value))}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Category</label>
          {categoriesLoading ? (
            <div>Loading categories...</div>
          ) : (
            <div className="category-selector">
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className={`category-item ${selectedCategory?.id === cat.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Location</label>
            {locationsLoading ? (
              <div>Loading locations...</div>
            ) : (
              <select
                value={selectedLocation?.id || ''}
                onChange={(e) => {
                  const selected = locations.find(loc => loc.id === e.target.value);
                  setSelectedLocation(selected || null);
                }}
                required
              >
                <option value="">Select a location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="splitType">Split</label>
            <select
              id="splitType"
              value={splitType}
              onChange={e => setSplitType(e.target.value as '50/50' | '100%')}
              className="form-control"
            >
              {splitTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this expense for?"
          />
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Saving...' : expense ? 'Update Expense' : 'Create Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}