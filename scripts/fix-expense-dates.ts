/**
 * Migration script to fix expense dates in Firestore
 * 
 * This script fixes expenses where the date field was incorrectly migrated
 * from a Firestore Timestamp to a map object.
 * 
 * Usage:
 * 1. ts-node scripts/fix-expense-dates.ts
 * 
 * Note: This script is configured to run against the STAGING Firebase project.
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  Timestamp, 
  updateDoc, 
  doc, 
  writeBatch,
  limit
} from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load staging environment variables explicitly
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(projectRoot, '.env.staging') });

// Confirm which environment we're using
console.log('====================================');
console.log('ENVIRONMENT: STAGING');
console.log(`Project ID: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
console.log('====================================');

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Check if an object is likely an incorrectly migrated Firestore Timestamp
 */
function isTimestampLikeObject(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    'seconds' in obj &&
    typeof obj.seconds === 'number' &&
    'nanoseconds' in obj &&
    typeof obj.nanoseconds === 'number'
  );
}

/**
 * Fix the expense dates in Firestore
 */
async function fixExpenseDates() {
  console.log(`Starting date migration for project: ${process.env.VITE_FIREBASE_PROJECT_ID}...`);
  
  // Ask for confirmation before proceeding
  if (!process.env.SKIP_CONFIRMATION) {
    console.log('\nWARNING: This will update expense dates in your Firebase STAGING database.');
    console.log('Press Ctrl+C now to cancel if this is not what you want.\n');
    
    // Wait 5 seconds to give user time to cancel
    console.log('Continuing in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  try {
    // Get all expenses from Firestore
    const expensesRef = collection(db, 'expenses');
    const expensesSnapshot = await getDocs(expensesRef);
    
    if (expensesSnapshot.empty) {
      console.log('No expenses found!');
      return;
    }
    
    console.log(`Found ${expensesSnapshot.size} expense documents`);
    
    let fixedCount = 0;
    let currentBatch = writeBatch(db);
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch size limit is 500
    
    // Loop through all expenses
    for (const expenseDoc of expensesSnapshot.docs) {
      const expenseData = expenseDoc.data();
      
      // Debug what the date looks like
      console.log(`Expense ${expenseDoc.id} date:`, JSON.stringify(expenseData.date));
      
      // Check if the date field is an object rather than a Timestamp
      if (expenseData.date && isTimestampLikeObject(expenseData.date) && !(expenseData.date instanceof Timestamp)) {
        const { seconds, nanoseconds } = expenseData.date;
        
        console.log(`Converting date for expense ${expenseDoc.id} from:`, expenseData.date);
        
        // Create a proper Timestamp
        const properTimestamp = new Timestamp(seconds, nanoseconds);
        
        // Update the document in the batch
        currentBatch.update(doc(db, 'expenses', expenseDoc.id), { 
          date: properTimestamp 
        });
        
        fixedCount++;
        batchCount++;
        
        // If we've reached the batch limit, commit and create a new batch
        if (batchCount >= BATCH_SIZE) {
          await currentBatch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          currentBatch = writeBatch(db);
          batchCount = 0;
        }
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await currentBatch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`Migration complete! Fixed ${fixedCount} expenses.`);
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
fixExpenseDates()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in migration:', error);
    process.exit(1);
  }); 