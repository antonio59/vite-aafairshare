import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

function loadJson(filename) {
  return JSON.parse(readFileSync(join(__dirname, filename), 'utf8'));
}

function firestoreTimestampToISO(ts) {
  if (!ts || typeof ts !== 'object' || typeof ts._seconds !== 'number') return undefined;
  return new Date(ts._seconds * 1000).toISOString();
}

async function getSupabaseUsers() {
  const { data, error } = await supabase.from('users').select('uid, email, id');
  if (error) throw error;
  // Map by uid for quick lookup
  const map = {};
  for (const user of data) {
    map[user.uid] = user.id;
  }
  return map;
}

async function main() {
  const expenses = loadJson('expenses.json');
  const userIdMap = await getSupabaseUsers();
  const categoryMap = loadJson('categories-map.json');
  const locationMap = loadJson('locations-map.json');
  const toImport = [];

  for (const exp of expenses) {
    if (exp.paidById) {
      // Debug: print the paidById being checked
      console.log(`Checking expense paidById: ${exp.paidById}`);
      // Map paidById to Supabase user's id
      const paidById = userIdMap[exp.paidById];
      if (!paidById) {
        console.warn(`No Supabase user found for paidById: ${exp.paidById}`);
        continue;
      } else {
        console.log(`Found Supabase user for paidById: ${exp.paidById} -> user_id: ${paidById}`);
      }
      // Map categoryId and locationId
      const category_id = exp.categoryId ? categoryMap[exp.categoryId] || null : null;
      const location_id = exp.locationId ? locationMap[exp.locationId] || null : null;
      if (exp.categoryId && !category_id) {
        console.warn(`No Supabase category found for categoryId: ${exp.categoryId}`);
      }
      if (exp.locationId && !location_id) {
        console.warn(`No Supabase location found for locationId: ${exp.locationId}`);
      }
      toImport.push({
        amount: exp.amount,
        description: exp.description || null,
        date: firestoreTimestampToISO(exp.date),
        paid_by_id: paidById,
        category_id,
        location_id,
        created_at: firestoreTimestampToISO(exp.createdAt),
        updated_at: firestoreTimestampToISO(exp.updatedAt),
        split_type: exp.splitType || null,
        month: exp.month || null
      });
    }
  }

  for (const exp of toImport) {
    const { error } = await supabase.from('expenses').insert(exp);
    if (error) {
      console.error('Error importing expense:', error, exp);
    } else {
      console.log('Imported expense:', exp);
    }
  }

  console.log('Full expense import completed!');
}

main(); 