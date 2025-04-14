/**
 * Migration script to fix expense dates in Firestore using Firebase Admin SDK
 * 
 * This script fixes expenses where the date field was incorrectly migrated
 * from a Firestore Timestamp to a map object.
 * 
 * Usage:
 * node scripts/fix-expense-dates.mjs
 * 
 * Note: This script is configured to run against the STAGING Firebase project.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Service account key file path
const serviceAccountPath = path.resolve(projectRoot, 'serviceAccountKey.staging.json');

// Verify the service account file exists
try {
  readFileSync(serviceAccountPath);
} catch (error) {
  console.error(`Service account key file not found at: ${serviceAccountPath}`);
  process.exit(1);
}

// Parse service account JSON
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin with service account
try {
  initializeApp({
    credential: cert(serviceAccount)
  });
  
  console.log('====================================');
  console.log('ENVIRONMENT: STAGING (Admin SDK)');
  console.log(`Project ID: ${serviceAccount.project_id}`);
  console.log('====================================');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

// Get Firestore reference
const db = getFirestore();

/**
 * Check if an object is likely an incorrectly migrated Firestore Timestamp
 */
function isTimestampLikeObject(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    (
      // Check for the format in the first screenshot (_seconds and _nanoseconds)
      ('_seconds' in obj && typeof obj._seconds === 'number' &&
       '_nanoseconds' in obj && typeof obj._nanoseconds === 'number') ||
      // Also check for the format without underscores as a fallback
      ('seconds' in obj && typeof obj.seconds === 'number' &&
       'nanoseconds' in obj && typeof obj.nanoseconds === 'number')
    )
  );
}

/**
 * Fix the expense dates in Firestore
 */
async function fixExpenseDates() {
  console.log(`Starting date migration for project: ${serviceAccount.project_id}...`);
  
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
    console.log('Fetching expenses collection...');
    const expensesSnapshot = await db.collection('expenses').get();
    
    if (expensesSnapshot.empty) {
      console.log('No expenses found!');
      return;
    }
    
    console.log(`Found ${expensesSnapshot.size} expense documents`);
    
    let fixedCount = 0;
    let batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch size limit is 500
    
    // Loop through all expenses
    for (const expenseDoc of expensesSnapshot.docs) {
      const expenseData = expenseDoc.data();
      
      // Debug what the date looks like
      console.log(`Expense ${expenseDoc.id} date:`, JSON.stringify(expenseData.date));
      
      // Check if the date field is a map object rather than a Timestamp
      if (expenseData.date && isTimestampLikeObject(expenseData.date)) {
        // Determine if it's already a Firestore Timestamp or needs conversion
        const needsConversion = typeof expenseData.date.toDate !== 'function';
        
        if (needsConversion) {
          // Extract seconds and nanoseconds, handling both formats
          const seconds = expenseData.date._seconds !== undefined ? 
            expenseData.date._seconds : expenseData.date.seconds;
          const nanoseconds = expenseData.date._nanoseconds !== undefined ? 
            expenseData.date._nanoseconds : expenseData.date.nanoseconds;
          
          console.log(`Converting date for expense ${expenseDoc.id} from:`, expenseData.date);
          
          if (seconds !== undefined && nanoseconds !== undefined) {
            // Create a proper Timestamp with the Admin SDK
            const properTimestamp = new Timestamp(seconds, nanoseconds);
            
            // Update the document in the batch
            batch.update(db.collection('expenses').doc(expenseDoc.id), { 
              date: properTimestamp 
            });
            
            fixedCount++;
            batchCount++;
            
            // If we've reached the batch limit, commit and create a new batch
            if (batchCount >= BATCH_SIZE) {
              await batch.commit();
              console.log(`Committed batch of ${batchCount} updates`);
              batch = db.batch();
              batchCount = 0;
            }
          } else {
            console.warn(`Cannot convert date for expense ${expenseDoc.id}: invalid seconds/nanoseconds`);
          }
        }
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`Migration complete! Fixed ${fixedCount} expenses.`);
  } catch (error) {
    console.error('Error during migration:', error);
    console.log('\nIf you see permissions errors:');
    console.log('1. Make sure the service account key has the necessary permissions');
    console.log('2. Verify the service account belongs to the correct Firebase project');
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