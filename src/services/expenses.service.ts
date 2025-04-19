/**
 * Expenses Service
 * 
 * This service provides methods for managing expenses in the application.
 */

import { Expense, ExpenseWithDetails, Category, Location, User, CategoryIconName } from '@shared/types';
import { 
  getDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument,
  whereConstraint
} from './firestore.service';
import { getCategories } from './resources.service';
import { getLocations } from './resources.service';
import { getMonthFromDate } from '@/lib/utils';
import { toUUID, toISODateString } from '@shared/utils/typeGuards';
import type { PositiveNumber } from '@shared/types';

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
  // Ensure all branded types and required fields are set
  const expenseWithMonth = {
    ...expense,
    // TODO: Use a branded utility for PositiveNumber
    amount: expense.amount as PositiveNumber,
    categoryId: toUUID(expense.categoryId),
    locationId: toUUID(expense.locationId),
    paidById: toUUID(expense.paidById),
    splitBetweenIds: expense.splitBetweenIds.map(id => toUUID(id)),
    splitType: expense.splitType || '50/50', // Default to '50/50' if not set
    month: expense.month || getMonthFromDate(expense.date),
    date: toISODateString(expense.date),
    createdAt: toISODateString(new Date()),
    updatedAt: toISODateString(expense.updatedAt)
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
  const updates: any = { ...expense };
  if (expense.amount !== undefined) updates.amount = expense.amount as PositiveNumber; // TODO: Use branded utility
  if (expense.categoryId !== undefined) updates.categoryId = toUUID(expense.categoryId);
  if (expense.locationId !== undefined) updates.locationId = toUUID(expense.locationId);
  if (expense.paidById !== undefined) updates.paidById = toUUID(expense.paidById);
  if (expense.splitBetweenIds !== undefined) updates.splitBetweenIds = expense.splitBetweenIds.map(id => toUUID(id));
  if (expense.date !== undefined) {
    updates.date = toISODateString(expense.date);
    updates.month = getMonthFromDate(expense.date);
  }
  if (expense.splitType === undefined) {
    updates.splitType = '50/50';
  } else {
    updates.splitType = expense.splitType;
  }
  if (expense.updatedAt !== undefined) updates.updatedAt = toISODateString(expense.updatedAt);
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
    const user = userMap.get(expense.paidById);
    // Construct a fully valid User object for paidBy
    const paidBy: User = user || {
      id: toUUID(expense.paidById),
      uid: expense.paidById,
      email: 'unknown@example.com',
      username: 'Unknown User',
      photoURL: null,
      createdAt: toISODateString(new Date().toISOString()),
      updatedAt: toISODateString(new Date().toISOString()),
      isAnonymous: false
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