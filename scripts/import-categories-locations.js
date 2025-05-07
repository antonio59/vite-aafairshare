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

async function importTable(table, data, fieldMap = x => x) {
  for (const item of data) {
    const mapped = fieldMap(item);
    const { error } = await supabase.from(table).upsert(mapped);
    if (error) {
      console.error(`Error importing to ${table}:`, error, mapped);
    } else {
      console.log(`Imported to ${table}:`, mapped.name || mapped.id);
    }
  }
}

async function main() {
  // Categories
  const categories = loadJson('categories.json');
  await importTable('categories', categories, c => ({
    name: c.name,
    color: c.color || null,
    icon: c.icon || null,
    created_at: c.created_at ? new Date(c.created_at).toISOString() : undefined,
    firebase_id: c.id
  }));

  // Locations
  const locations = loadJson('locations.json');
  await importTable('locations', locations, l => ({
    name: l.name,
    created_at: l.created_at ? new Date(l.created_at).toISOString() : undefined,
    firebase_id: l.id
  }));

  console.log('Import completed!');
}

main(); 