/**
 * Migration script to fix expense amount fields in Firestore using Firebase Admin SDK
 * 
 * This script fixes expenses where the amount field was stored as a string instead of a number.
 * 
 * Usage:
 * node scripts/fix-amount-fields.mjs [environment]
 * 
 * Where [environment] is either 'staging' or 'production' (defaults to 'staging')
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the environment from command line args
const env = process.argv[2]?.toLowerCase() || 'staging';
if (!['staging', 'production'].includes(env)) {
  console.error('Invalid environment. Please specify either "staging" or "production"');
  process.exit(1);
}

// Get the directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Service account key file path based on environment
const serviceAccountPath = path.resolve(
  projectRoot, 
  env === 'production' 
    ? 'serviceAccountKey.json' 
    : 'serviceAccountKey.staging.json'
);

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
  console.log(`ENVIRONMENT: ${env.toUpperCase()} (Admin SDK)`);
  console.log(`Project ID: ${serviceAccount.project_id}`);
  console.log('====================================');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

// Get Firestore reference
const db = getFirestore();

/**
 * Fix expense amount fields in Firestore
 */
async function fixAmountFields() {
  console.log(`Starting amount field migration for project: ${serviceAccount.project_id}...`);
  
  // Ask for confirmation before proceeding
  if (!process.env.SKIP_CONFIRMATION) {
    console.log(`\nWARNING: This will update amount fields in your Firebase ${env.toUpperCase()} database.`);
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
      
      // Check if amount field exists and is a string
      if (expenseData.amount !== undefined) {
        const isString = typeof expenseData.amount === 'string';
        const currentAmount = expenseData.amount;
        
        console.log(`Expense ${expenseDoc.id} amount: ${currentAmount} (${typeof currentAmount})`);
        
        // Convert string amount to number if needed
        if (isString || typeof currentAmount !== 'number') {
          // Convert to number, using parseFloat to handle decimal values
          const numericAmount = parseFloat(currentAmount);
          
          // Only update if the conversion is valid
          if (!isNaN(numericAmount)) {
            console.log(`Converting amount for expense ${expenseDoc.id} from "${currentAmount}" to ${numericAmount}`);
            
            // Update the document in the batch
            batch.update(db.collection('expenses').doc(expenseDoc.id), { 
              amount: numericAmount 
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
            console.warn(`Cannot convert amount for expense ${expenseDoc.id}: invalid number format "${currentAmount}"`);
          }
        }
      } else {
        console.warn(`Expense ${expenseDoc.id} does not have an amount field`);
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`\nMigration complete!`);
    console.log(`Updated ${fixedCount} amount fields`);
  } catch (error) {
    console.error('Error during migration:', error);
    console.log('\nIf you see permissions errors:');
    console.log('1. Make sure the service account key has the necessary permissions');
    console.log('2. Verify the service account belongs to the correct Firebase project');
  }
}

// Run the migration
fixAmountFields()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in migration:', error);
    process.exit(1);
  }); 