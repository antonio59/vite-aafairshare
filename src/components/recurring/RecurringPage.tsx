import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User, Category, Location } from '../../types/expense';
import './RecurringPage.css';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  category?: Category;
  locationId: string;
  location?: Location;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  startDate: Date;
  paidByUserId: string;
  splitType: '50/50' | '100%';
}

export default function RecurringPage() {
  const { currentUser } = useAuth() as AuthContextType;
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecurringExpense, setSelectedRecurringExpense] = useState<RecurringExpense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch data when component mounts
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        console.log('Loaded categories:', categoriesData);
        setCategories(categoriesData);
        
        // Fetch locations
        const locationsSnapshot = await getDocs(collection(db, 'locations'));
        const locationsData = locationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Location[];
        console.log('Loaded locations:', locationsData);
        setLocations(locationsData);
        
        // Fetch recurring expenses
        const recurringRef = collection(db, 'recurring_expenses');
        const q = query(
          recurringRef,
          where('paidByUserId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Recurring expenses query returned:', querySnapshot.docs.length, 'docs');
        
        const recurringList = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Convert timestamp to Date if needed
          const startDate = data.startDate instanceof Date 
            ? data.startDate 
            : data.startDate?.toDate?.() || new Date();
          
          // Find the referenced category and location
          let category = undefined;
          let location = undefined;
          
          if (data.categoryId) {
            category = categoriesData.find(c => c.id === data.categoryId);
          }
          
          if (data.locationId) {
            location = locationsData.find(l => l.id === data.locationId);
          }
          
          return {
            id: doc.id,
            ...data,
            startDate,
            category,
            location
          } as RecurringExpense;
        }));
        
        console.log('Processed recurring expenses:', recurringList);
        setRecurringExpenses(recurringList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);
  
  const handleAddRecurringExpense = () => {
    setSelectedRecurringExpense(null);
    setIsFormOpen(true);
  };
  
  const handleEditRecurringExpense = (recurringExpense: RecurringExpense) => {
    setSelectedRecurringExpense(recurringExpense);
    setIsFormOpen(true);
  };
  
  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedRecurringExpense(null);
  };
  
  const handleFormSubmit = async (formData: Partial<RecurringExpense>) => {
    if (!currentUser) return;
    
    try {
      // Prepare data for Firestore
      const recurringData = {
        ...formData,
        paidByUserId: currentUser.uid,
      };
      
      if (selectedRecurringExpense) {
        // Update existing recurring expense
        const recurringRef = doc(db, 'recurring_expenses', selectedRecurringExpense.id);
        await updateDoc(recurringRef, recurringData);
        
        // Update local state
        const updatedExpenses = recurringExpenses.map(exp => 
          exp.id === selectedRecurringExpense.id 
            ? { 
                ...exp, 
                ...formData,
                category: categories.find(c => c.id === formData.categoryId),
                location: locations.find(l => l.id === formData.locationId)
              } 
            : exp
        );
        setRecurringExpenses(updatedExpenses);
      } else {
        // Add new recurring expense
        const docRef = await addDoc(collection(db, 'recurring_expenses'), recurringData);
        
        // Update local state
        const newExpense = {
          id: docRef.id,
          ...recurringData,
          category: categories.find(c => c.id === formData.categoryId),
          location: locations.find(l => l.id === formData.locationId)
        } as RecurringExpense;
        
        setRecurringExpenses([...recurringExpenses, newExpense]);
      }
      
      handleFormClose();
    } catch (error) {
      console.error('Error saving recurring expense:', error);
    }
  };
  
  const handleDeleteRecurringExpense = async (id: string) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'recurring_expenses', id));
      
      // Update local state
      setRecurringExpenses(recurringExpenses.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
    }
  };
  
  if (isLoading) {
    return <div className="loading-indicator">Loading recurring expenses...</div>;
  }
  
  return (
    <div className="recurring-container">
      <div className="recurring-header">
        <h1>Recurring Expenses</h1>
        <button 
          className="add-recurring-button"
          onClick={handleAddRecurringExpense}
        >
          Add Recurring Expense
        </button>
      </div>
      
      {recurringExpenses.length === 0 ? (
        <div className="no-data">No recurring expenses found. Add one to get started!</div>
      ) : (
        <div className="recurring-list">
          {recurringExpenses.map(expense => (
            <div key={expense.id} className="recurring-item">
              <div className="recurring-details">
                <div className="recurring-category-icon">
                  {expense.category?.icon || '📁'}
                </div>
                <div className="recurring-info">
                  <h3>{expense.description}</h3>
                  <div className="recurring-meta">
                    <span className="recurring-category">{expense.category?.name || 'Uncategorized'}</span>
                    <span className="recurring-location">{expense.location?.name || 'Unknown location'}</span>
                    <span className="recurring-frequency">{expense.frequency}</span>
                  </div>
                </div>
                <div className="recurring-amount">
                  £{expense.amount.toFixed(2)}
                </div>
              </div>
              <div className="recurring-actions">
                <button
                  onClick={() => handleEditRecurringExpense(expense)}
                  className="edit-button"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRecurringExpense(expense.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isFormOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedRecurringExpense ? 'Edit' : 'Add'} Recurring Expense</h2>
            <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formElements = form.elements as HTMLFormControlsCollection & {
                description: HTMLInputElement;
                amount: HTMLInputElement;
                category: HTMLSelectElement;
                location: HTMLSelectElement;
                frequency: HTMLSelectElement;
                startDate: HTMLInputElement;
                splitType: HTMLSelectElement;
              };
              
              const formData = {
                description: formElements.description.value,
                amount: parseFloat(formElements.amount.value),
                categoryId: formElements.category.value,
                locationId: formElements.location.value,
                frequency: formElements.frequency.value as 'weekly' | 'monthly' | 'quarterly' | 'annually',
                startDate: new Date(formElements.startDate.value),
                splitType: formElements.splitType.value as '50/50' | '100%'
              };
              handleFormSubmit(formData);
            }}>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  defaultValue={selectedRecurringExpense?.description || ''}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">Amount (£)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.01"
                  min="0"
                  defaultValue={selectedRecurringExpense?.amount || ''}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  defaultValue={selectedRecurringExpense?.categoryId || ''}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <select
                  id="location"
                  name="location"
                  defaultValue={selectedRecurringExpense?.locationId || ''}
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="frequency">Frequency</label>
                <select
                  id="frequency"
                  name="frequency"
                  defaultValue={selectedRecurringExpense?.frequency || 'monthly'}
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  defaultValue={selectedRecurringExpense ? selectedRecurringExpense.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="splitType">Split Type</label>
                <select
                  id="splitType"
                  name="splitType"
                  defaultValue={selectedRecurringExpense?.splitType || '50/50'}
                  required
                >
                  <option value="50/50">50/50 Split</option>
                  <option value="100%">100% (Not Split)</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleFormClose} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {selectedRecurringExpense ? 'Update' : 'Add'} Recurring Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}