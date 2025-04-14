/**
 * Migration script to fix all timestamp fields in Firestore using Firebase Admin SDK
 * 
 * This script fixes expenses where timestamp fields (date, createdAt, updatedAt) 
 * were incorrectly migrated from Firestore Timestamp to map objects.
 * 
 * Usage:
 * node scripts/fix-all-timestamps.mjs
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

// Fields to check and fix
const TIMESTAMP_FIELDS = ['date', 'createdAt', 'updatedAt'];

/**
 * Check if an object is likely an incorrectly migrated Firestore Timestamp
 */
function isTimestampLikeObject(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    (
      // Check for the format with underscores (_seconds and _nanoseconds)
      ('_seconds' in obj && typeof obj._seconds === 'number' &&
       '_nanoseconds' in obj && typeof obj._nanoseconds === 'number') ||
      // Also check for the format without underscores as a fallback
      ('seconds' in obj && typeof obj.seconds === 'number' &&
       'nanoseconds' in obj && typeof obj.nanoseconds === 'number')
    )
  );
}

/**
 * Fix all timestamp fields in Firestore
 */
async function fixAllTimestamps() {
  console.log(`Starting timestamp field migration for project: ${serviceAccount.project_id}...`);
  
  // Ask for confirmation before proceeding
  if (!process.env.SKIP_CONFIRMATION) {
    console.log('\nWARNING: This will update timestamp fields in your Firebase STAGING database.');
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
    
    let fixedFields = {
      date: 0,
      createdAt: 0,
      updatedAt: 0
    };
    let totalDocumentsUpdated = 0;
    
    let batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch size limit is 500
    
    // Loop through all expenses
    for (const expenseDoc of expensesSnapshot.docs) {
      const expenseData = expenseDoc.data();
      let docUpdated = false;
      const updates = {};
      
      // Check each timestamp field
      for (const field of TIMESTAMP_FIELDS) {
        if (!expenseData[field]) continue;
        
        // Debug what the field looks like
        console.log(`Expense ${expenseDoc.id} ${field}:`, JSON.stringify(expenseData[field]));
        
        // Check if the field is a map object rather than a Timestamp
        if (isTimestampLikeObject(expenseData[field])) {
          // Determine if it's already a Firestore Timestamp or needs conversion
          const needsConversion = typeof expenseData[field].toDate !== 'function';
          
          if (needsConversion) {
            // Extract seconds and nanoseconds, handling both formats
            const seconds = expenseData[field]._seconds !== undefined ? 
              expenseData[field]._seconds : expenseData[field].seconds;
            const nanoseconds = expenseData[field]._nanoseconds !== undefined ? 
              expenseData[field]._nanoseconds : expenseData[field].nanoseconds;
            
            console.log(`Converting ${field} for expense ${expenseDoc.id} from:`, expenseData[field]);
            
            if (seconds !== undefined && nanoseconds !== undefined) {
              // Create a proper Timestamp with the Admin SDK
              const properTimestamp = new Timestamp(seconds, nanoseconds);
              
              // Add to updates
              updates[field] = properTimestamp;
              fixedFields[field]++;
              docUpdated = true;
            } else {
              console.warn(`Cannot convert ${field} for expense ${expenseDoc.id}: invalid seconds/nanoseconds`);
            }
          }
        }
      }
      
      // If any fields were updated, update the document
      if (docUpdated) {
        batch.update(db.collection('expenses').doc(expenseDoc.id), updates);
        totalDocumentsUpdated++;
        batchCount++;
        
        // If we've reached the batch limit, commit and create a new batch
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`\nMigration complete!`);
    console.log(`Updated documents: ${totalDocumentsUpdated}`);
    console.log(`Fields fixed:`);
    console.log(`- date: ${fixedFields.date}`);
    console.log(`- createdAt: ${fixedFields.createdAt}`);
    console.log(`- updatedAt: ${fixedFields.updatedAt}`);
  } catch (error) {
    console.error('Error during migration:', error);
    console.log('\nIf you see permissions errors:');
    console.log('1. Make sure the service account key has the necessary permissions');
    console.log('2. Verify the service account belongs to the correct Firebase project');
  }
}

// Run the migration
fixAllTimestamps()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in migration:', error);
    process.exit(1);
  }); 