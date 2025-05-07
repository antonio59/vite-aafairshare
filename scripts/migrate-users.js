import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'firebase-service-account.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function migrateUsers() {
  try {
    // Get all users from Firebase
    const listUsersResult = await admin.auth().listUsers();
    const firebaseUsers = listUsersResult.users;

    console.log(`Found ${firebaseUsers.length} users in Firebase`);

    // Transform and insert users into Supabase
    for (const user of firebaseUsers) {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          uid: user.uid,
          email: user.email,
          username: user.displayName || null,
          photo_url: user.photoURL || null,
          created_at: new Date(user.metadata.creationTime).toISOString(),
          updated_at: new Date(user.metadata.lastSignInTime).toISOString(),
          is_anonymous: user.providerData.length === 0
        }, {
          onConflict: 'email'
        });

      if (error) {
        console.error(`Error migrating user ${user.email}:`, error);
      } else {
        console.log(`Successfully migrated user: ${user.email}`);
      }
    }

    console.log('User migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Clean up Firebase Admin
    await admin.app().delete();
  }
}

migrateUsers(); 