import { supabase } from '@/lib/supabase';
import { Category, Location } from '@shared/types';

export class ResourcesService {
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Category[];
  }

  static async getCategory(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Category;
  }

  static async createCategory(category: Omit<Category, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        ...category,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  static async updateCategory(id: string, category: Partial<Omit<Category, 'id' | 'createdAt'>>) {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  static async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Location[];
  }

  static async getLocation(id: string) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Location;
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

  static async updateLocation(id: string, location: Partial<Omit<Location, 'id'>>) {
    const { data, error } = await supabase
      .from('locations')
      .update(location)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Location;
  }

  static async deleteLocation(id: string) {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
} 