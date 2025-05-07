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

function toISODate(dateStr) {
  if (!dateStr) return null;
  // Handle Firestore timestamp object
  if (typeof dateStr === 'object' && typeof dateStr._seconds === 'number') {
    return new Date(dateStr._seconds * 1000).toISOString();
  }
  // If it's a string, try to parse as ISO or RFC2822
  if (typeof dateStr === 'string') {
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
    // Try to parse Firestore's human-readable format: '7 April 2025 at 10:32:15 UTC+1'
    const match = dateStr.match(/(\d{1,2}) ([A-Za-z]+) (\d{4}) at (\d{2}:\d{2}:\d{2})/);
    if (match) {
      const [_, day, monthName, year, time] = match;
      const months = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
      };
      const month = months[monthName];
      if (month !== undefined) {
        const dateObj = new Date(Date.UTC(
          parseInt(year),
          month,
          parseInt(day),
          ...time.split(':').map(Number)
        ));
        return dateObj.toISOString();
      }
    }
  }
  return null;
}

async function getSupabaseUsers() {
  const { data, error } = await supabase.from('users').select('uid, id');
  if (error) throw error;
  const map = {};
  for (const user of data) {
    map[user.uid] = user.id;
  }
  return map;
}

async function main() {
  const settlements = loadJson('settlements.json');
  const userIdMap = await getSupabaseUsers();
  for (const s of settlements) {
    const from_user_id = userIdMap[s.fromUserId] || null;
    const to_user_id = userIdMap[s.toUserId] || null;
    const recorded_by = userIdMap[s.recordedBy] || null;
    const isoDate = toISODate(s.date) || toISODate(s.createdAt);
    if (!from_user_id || !to_user_id) {
      console.warn(`Skipping settlement: missing user mapping for fromUserId or toUserId`, s);
      continue;
    }
    if (!isoDate) {
      console.warn(`Skipping settlement: could not parse date from`, s.date, s.createdAt);
      continue;
    }
    const insertObj = {
      amount: s.amount,
      date: isoDate,
      from_user_id,
      to_user_id,
      status: s.status || 'completed',
      created_at: toISODate(s.createdAt),
      month: s.month || null,
      notes: s.notes || null,
      recorded_by
    };
    const { error } = await supabase.from('settlements').insert(insertObj);
    if (error) {
      console.error('Error importing settlement:', error, insertObj);
    } else {
      console.log('Imported settlement:', insertObj);
    }
  }
  console.log('Settlement import completed!');
}

main(); 