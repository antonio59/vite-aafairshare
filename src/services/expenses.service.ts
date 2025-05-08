/**
 * Expenses Service
 * 
 * This service provides methods for managing expenses in the application.
 */

import { supabase } from '@/lib/supabase';
import { Expense, ExpenseWithDetails, Category, Location, User } from '@shared/types';

export class ExpensesService {
  static async getExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*),
        location:locations(*),
        paidBy:users(*)
      `);

    if (error) throw error;
    return data as ExpenseWithDetails[];
  }

  static async getExpense(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*),
        location:locations(*),
        paidBy:users(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ExpenseWithDetails;
  }

  static async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        ...expense,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  }

  static async updateExpense(id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...expense,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  }

  static async deleteExpense(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Category[];
  }

  static async getLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Location[];
  }

  static async createLocation(name: string) {
    const { data, error } = await supabase
      .from('locations')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    return data as Location;
  }

  static async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('username');

    if (error) throw error;
    return data as User[];
  }
}

export default ExpensesService; 