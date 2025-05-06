import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL');
if (!supabaseKey) throw new Error('Missing VITE_SUPABASE_KEY');

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Helper function to handle Supabase errors
export function handleSupabaseError(error: Error): never {
  console.error('Supabase error:', error);
  throw error;
} 