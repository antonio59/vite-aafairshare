import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
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

async function exportMap(table) {
  const { data, error } = await supabase.from(table).select('id, firebase_id');
  if (error) throw error;
  const map = {};
  for (const row of data) {
    if (row.firebase_id) {
      map[row.firebase_id] = row.id;
    }
  }
  writeFileSync(join(__dirname, `${table}-map.json`), JSON.stringify(map, null, 2));
  console.log(`Exported ${Object.keys(map).length} mappings for ${table}`);
}

async function main() {
  await exportMap('categories');
  await exportMap('locations');
  console.log('Mapping export completed!');
}

main(); 