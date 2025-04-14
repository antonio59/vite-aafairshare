/**
 * Expenses Service
 * 
 * This service provides methods for managing expenses in the application.
 */

import { Expense, ExpenseWithDetails, Category, Location, User } from '@/types/expense';
import { CategoryIconName } from '@/lib/constants';
import { 
  getDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument,
  whereConstraint
} from './firestore.service';
import { getCategories } from './resources.service';
import { getLocations } from './resources.service';

// Collection name
const EXPENSES_COLLECTION = 'expenses';

/**
 * Gets expenses for a specific month
 * 
 * @param month - The month in 'YYYY-MM' format
 * @returns A promise that resolves to an array of expenses for the month
 */
export const getExpensesByMonth = async (month: string): Promise<Expense[]> => {
  return getDocuments<Expense>(
    EXPENSES_COLLECTION,
    [whereConstraint('month', '==', month)]
  );
};

/**
 * Creates a new expense
 * 
 * @param expense - The expense to create (without id and createdAt)
 * @returns A promise that resolves to the ID of the new expense
 */
export const createExpense = async (
  expense: Omit<Expense, 'id' | 'createdAt'>
): Promise<string> => {
  // Make sure the month is derived from the date if not provided
  const expenseWithMonth = {
    ...expense,
    month: expense.month || formatDateToMonth(expense.date)
  };
  
  const docRef = await createDocument(EXPENSES_COLLECTION, expenseWithMonth);
  return docRef.id;
};

/**
 * Updates an existing expense
 * 
 * @param id - The ID of the expense to update
 * @param expense - The expense data to update
 * @returns A promise that resolves when the expense is updated
 */
export const updateExpense = async (
  id: string,
  expense: Partial<Omit<Expense, 'id' | 'createdAt'>>
): Promise<void> => {
  // If the date is updated, also update the month
  const updates = { ...expense };
  if (expense.date) {
    updates.month = formatDateToMonth(expense.date);
  }
  
  return updateDocument(EXPENSES_COLLECTION, id, updates);
};

/**
 * Deletes an expense
 * 
 * @param id - The ID of the expense to delete
 * @returns A promise that resolves when the expense is deleted
 */
export const deleteExpense = async (id: string): Promise<void> => {
  return deleteDocument(EXPENSES_COLLECTION, id);
};

/**
 * Gets expenses with detailed category, location, and user information
 * 
 * @param month - The month in 'YYYY-MM' format
 * @param users - Array of users for resolving the paidBy field
 * @returns A promise that resolves to an array of expenses with details
 */
export const getExpensesWithDetails = async (
  month: string,
  users: User[]
): Promise<ExpenseWithDetails[]> => {
  // Get all required data
  const [expenses, categories, locations] = await Promise.all([
    getExpensesByMonth(month),
    getCategories(),
    getLocations()
  ]);
  
  // Create maps for efficient lookups
  const categoryMap = new Map<string, Category>(
    categories.map(category => [category.id, category])
  );
  
  const locationMap = new Map<string, Location>(
    locations.map(location => [location.id, location])
  );
  
  const userMap = new Map<string, User>(
    users.map(user => [user.id, user])
  );
  
  // Enrich expenses with details
  return expenses.map(expense => {
    // Lookup category or create placeholder if missing
    const category = categoryMap.get(expense.categoryId) || {
      id: expense.categoryId,
      name: 'Unknown Category',
      icon: 'Shopping' as CategoryIconName,
      createdAt: new Date()
    };
    
    // Lookup location or create placeholder if missing
    const location = locationMap.get(expense.locationId) || {
      id: expense.locationId,
      name: 'Unknown Location',
      createdAt: new Date()
    };
    
    // Lookup user or create placeholder if missing
    const user = userMap.get(expense.paidByUserId);
    const paidBy = user || {
      id: expense.paidByUserId,
      uid: expense.paidByUserId,
      email: 'unknown@example.com',
      displayName: 'Unknown User'
    };
    
    // Return enriched expense
    return {
      ...expense,
      category,
      location,
      paidBy
    };
  });
};

/**
 * Helper function to format a date to 'YYYY-MM' format for month
 * 
 * @param date - The date to format
 * @returns The formatted month string
 */
const formatDateToMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}; 