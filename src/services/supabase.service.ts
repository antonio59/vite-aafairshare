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
  ExpenseWithDetails,
  SettlementWithUsers
} from '@shared/types';

export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

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
      month: expense.month,
      split_type: expense.splitType,
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
      month: expense.month,
      split_type: expense.splitType,
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

// Expense transformer for Supabase schema (maps to camelCase for app use)
function transformExpense(row: Tables['expenses']['Row']): Expense {
  return {
    id: row.id,
    amount: row.amount,
    categoryId: row.category_id ?? '',
    createdAt: row.created_at,
    date: row.date,
    description: row.description ?? '',
    locationId: row.location_id ?? '',
    month: row.month,
    paidById: row.paid_by_id ?? '',
    splitType: (row.split_type === '50/50' || row.split_type === '100%') ? row.split_type : '50/50',
    updatedAt: row.updated_at ?? ''
  };
}

function transformExpenseWithDetails(row: any): ExpenseWithDetails {
  return {
    ...transformExpense(row),
    // You may want to join and map category/location/paidBy details here if needed
    category: row.category ?? undefined,
    location: row.location ?? undefined,
    paidBy: row.paid_by ?? undefined
  };
}

// Settlement transformer for Supabase schema (maps to camelCase for app use)
function transformSettlement(row: Tables['settlements']['Row']): Settlement {
  return {
    id: row.id,
    amount: row.amount,
    createdAt: row.created_at ?? '',
    date: row.date,
    fromUserId: row.from_user_id ?? '',
    month: row.month,
    notes: row.notes ?? '',
    recordedBy: row.recorded_by ?? '',
    toUserId: row.to_user_id ?? '',
    status: (row as any).status ?? 'PENDING',
    updatedAt: (row as any).updated_at ?? ''
  };
}

function transformSettlementWithUsers(row: any): SettlementWithUsers {
  return {
    ...transformSettlement(row),
    fromUser: row.from_user ?? undefined,
    toUser: row.to_user ?? undefined
  };
}

export class SupabaseService {
  static async get<T extends keyof Tables>(
    table: T,
    query?: {
      select?: string
      eq?: { [key: string]: any }
      order?: { column: string; ascending?: boolean }
      limit?: number
    }
  ) {
    let queryBuilder = supabase.from(table).select(query?.select || '*')

    if (query?.eq) {
      Object.entries(query.eq).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })
    }

    if (query?.order) {
      queryBuilder = queryBuilder.order(query.order.column, {
        ascending: query.order.ascending ?? true
      })
    }

    if (query?.limit) {
      queryBuilder = queryBuilder.limit(query.limit)
    }

    const { data, error } = await queryBuilder

    if (error) throw error
    return data
  }

  static async create<T extends keyof Tables>(
    table: T,
    data: Tables[T]['Insert']
  ) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return result
  }

  static async update<T extends keyof Tables>(
    table: T,
    id: string,
    data: Partial<Tables[T]['Update']>
  ) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return result
  }

  static async delete<T extends keyof Tables>(table: T, id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id)

    if (error) throw error
  }

  static async subscribe<T extends keyof Tables>(
    table: T,
    callback: (_payload: {
      new: Tables[T]['Row'] | null
      old: Tables[T]['Row'] | null
      eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    }) => void
  ) {
    return supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as any, // Type workaround for Supabase client
        {
          event: '*',
          schema: 'public',
          table: table as string
        },
        callback
      )
      .subscribe()
  }
}

export default SupabaseService

export { transformUser, transformCategory, transformLocation, transformExpense, transformSettlement }; 