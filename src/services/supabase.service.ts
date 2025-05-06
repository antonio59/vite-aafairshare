import { supabase, handleSupabaseError } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { 
  User, 
  Category, 
  Location, 
  UUID, 
  ISODateString, 
  Expense, 
  Settlement,
  ExpenseSplitType,
  ExpenseWithDetails,
  SettlementWithUsers
} from '@shared/types';

type Tables = Database['public']['Tables'];

// Users
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('username');
  
  if (error) return handleSupabaseError(error);
  return data.map(transformUser);
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) return handleSupabaseError(error);
  return data.map(transformCategory);
}

export async function createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: category.name,
      color: category.color,
      icon: category.icon
    })
    .select()
    .single();
  
  if (error) return handleSupabaseError(error);
  return data.id;
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({
      name: category.name,
      color: category.color,
      icon: category.icon
    })
    .eq('id', id);
  
  if (error) return handleSupabaseError(error);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) return handleSupabaseError(error);
}

// Locations
export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name');
  
  if (error) return handleSupabaseError(error);
  return data.map(transformLocation);
}

export async function createLocation(location: Omit<Location, 'id'>): Promise<string> {
  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: location.name
    })
    .select()
    .single();
  
  if (error) return handleSupabaseError(error);
  return data.id;
}

export async function updateLocation(id: string, location: Partial<Location>): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .update({
      name: location.name
    })
    .eq('id', id);
  
  if (error) return handleSupabaseError(error);
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);
  
  if (error) return handleSupabaseError(error);
}

// Expenses
export async function getExpenses(month?: string): Promise<Expense[]> {
  let query = supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  
  if (month) {
    query = query.eq('month', month);
  }
  
  const { data, error } = await query;
  if (error) return handleSupabaseError(error);
  return data.map(transformExpense);
}

export async function getExpenseWithDetails(id: string): Promise<ExpenseWithDetails> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      category:categories(*),
      location:locations(*),
      paidBy:users!paid_by(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) return handleSupabaseError(error);
  return transformExpenseWithDetails(data);
}

export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      paid_by: expense.paidById,
      category_id: expense.categoryId,
      location_id: expense.locationId,
      participants: expense.splitBetweenIds,
      month: expense.month,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();
  
  if (error) return handleSupabaseError(error);
  return data.id;
}

export async function updateExpense(id: string, expense: Partial<Expense>): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      paid_by: expense.paidById,
      category_id: expense.categoryId,
      location_id: expense.locationId,
      participants: expense.splitBetweenIds,
      month: expense.month,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) return handleSupabaseError(error);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  
  if (error) return handleSupabaseError(error);
}

// Settlements
export async function getSettlements(month?: string): Promise<Settlement[]> {
  let query = supabase
    .from('settlements')
    .select('*')
    .order('date', { ascending: false });
  
  if (month) {
    query = query.eq('month', month);
  }
  
  const { data, error } = await query;
  if (error) return handleSupabaseError(error);
  return data.map(transformSettlement);
}

export async function getSettlementWithUsers(id: string): Promise<SettlementWithUsers> {
  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      fromUser:users!from_user_id(*),
      toUser:users!to_user_id(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) return handleSupabaseError(error);
  return transformSettlementWithUsers(data);
}

export async function createSettlement(settlement: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('settlements')
    .insert({
      from_user_id: settlement.fromUserId,
      to_user_id: settlement.toUserId,
      amount: settlement.amount,
      date: settlement.date,
      status: settlement.status,
      month: settlement.month,
      created_at: now
    })
    .select()
    .single();
  
  if (error) return handleSupabaseError(error);
  return data.id;
}

export async function updateSettlement(id: string, settlement: Partial<Settlement>): Promise<void> {
  const { error } = await supabase
    .from('settlements')
    .update({
      from_user_id: settlement.fromUserId,
      to_user_id: settlement.toUserId,
      amount: settlement.amount,
      date: settlement.date,
      status: settlement.status,
      month: settlement.month
    })
    .eq('id', id);
  
  if (error) return handleSupabaseError(error);
}

export async function deleteSettlement(id: string): Promise<void> {
  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', id);
  
  if (error) return handleSupabaseError(error);
}

// Data transformers
function transformUser(row: Tables['users']['Row']): User {
  const now = new Date().toISOString();
  return {
    id: row.id as UUID,
    uid: row.id as UUID, // Use the same ID for both
    email: row.email,
    username: row.username || row.email.split('@')[0],
    photoURL: row.photo_url,
    createdAt: row.created_at as ISODateString,
    updatedAt: now as ISODateString,
    isAnonymous: false
  };
}

function transformCategory(row: Tables['categories']['Row']): Category {
  return {
    id: row.id as UUID,
    name: row.name,
    color: row.color || '#000000',
    icon: row.icon || 'default',
    createdAt: row.created_at as ISODateString
  };
}

function transformLocation(row: Tables['locations']['Row']): Location {
  return {
    id: row.id,
    name: row.name
  };
}

function transformExpense(row: Tables['expenses']['Row']): Expense {
  return {
    id: row.id as UUID,
    amount: row.amount,
    description: row.description || '',
    categoryId: row.category_id as UUID,
    locationId: row.location_id as UUID,
    paidById: row.paid_by as UUID,
    splitBetweenIds: (row.participants as UUID[]) || [],
    splitType: '50/50' as ExpenseSplitType, // Default to 50/50 split
    month: row.month,
    date: row.date as ISODateString,
    createdAt: row.created_at as ISODateString,
    updatedAt: row.updated_at as ISODateString
  };
}

function transformExpenseWithDetails(row: any): ExpenseWithDetails {
  return {
    ...transformExpense(row),
    category: transformCategory(row.category),
    location: transformLocation(row.location),
    paidBy: transformUser(row.paidBy)
  };
}

function transformSettlement(row: Tables['settlements']['Row']): Settlement {
  return {
    id: row.id as UUID,
    fromUserId: row.from_user_id as UUID,
    toUserId: row.to_user_id as UUID,
    amount: row.amount,
    status: row.status as 'PENDING' | 'COMPLETED' | 'CANCELLED',
    month: row.month,
    date: row.date as ISODateString,
    createdAt: row.created_at as ISODateString,
    updatedAt: row.created_at as ISODateString // Use created_at as updated_at since we don't track updates
  };
}

function transformSettlementWithUsers(row: any): SettlementWithUsers {
  return {
    ...transformSettlement(row),
    fromUser: transformUser(row.fromUser),
    toUser: transformUser(row.toUser)
  };
} 