// sync-monthly-data.ts
// Usage: pnpm tsx scripts/sync-monthly-data.ts --month YYYY-MM [--dry-run]
// Syncs Firestore data for a given month from production to staging.
// Requires: pnpm add -D yargs @types/yargs

import { initializeApp, credential, ServiceAccount } from 'firebase-admin';
import { App } from 'firebase-admin/app';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// --- Types ---
interface SyncOptions {
  month: string; // 'YYYY-MM'
  dryRun: boolean;
}

interface FirestoreDoc<T = any> {
  id: string;
  data: T;
}

// --- Config ---
const SERVICE_ACCOUNT_PROD = path.resolve(__dirname, '../serviceAccountKey.json');
const SERVICE_ACCOUNT_STAGING = path.resolve(__dirname, '../serviceAccountKey.staging.json');
const COLLECTIONS = [
  'expenses',
  'settlements',
  // Add more collections as needed
];
const DATE_FIELDS = ['date', 'timestamp']; // Try these fields for filtering

// --- CLI ---
const argv = yargs(hideBin(process.argv))
  .option('month', {
    type: 'string',
    demandOption: true,
    describe: 'Month to sync in YYYY-MM format',
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
    describe: 'If set, does not write to staging',
  })
  .help()
  .argv as unknown as SyncOptions;

// --- Firebase Init ---
function initFirebase(serviceAccountPath: string, name: string): App {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;
  return initializeApp({
    credential: credential.cert(serviceAccount),
  }, name);
}

const prodApp = initFirebase(SERVICE_ACCOUNT_PROD, 'prod');
const stagingApp = initFirebase(SERVICE_ACCOUNT_STAGING, 'staging');
const prodDb = prodApp.firestore();
const stagingDb = stagingApp.firestore();

// --- Helpers ---
function getMonthRange(month: string): { start: Timestamp; end: Timestamp } {
  const [year, m] = month.split('-').map(Number);
  const start = new Date(year, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, m, 1, 0, 0, 0, 0); // next month
  return {
    start: Timestamp.fromDate(start),
    end: Timestamp.fromDate(end),
  };
}

async function queryMonthlyDocs(db: Firestore, collection: string, range: { start: Timestamp; end: Timestamp }): Promise<FirestoreDoc[]> {
  // Try each date field
  for (const field of DATE_FIELDS) {
    try {
      const snap = await db.collection(collection)
        .where(field, '>=', range.start)
        .where(field, '<', range.end)
        .get();
      if (!snap.empty) {
        return snap.docs.map(doc => ({ id: doc.id, data: doc.data() }));
      }
    } catch (err) {
      // Ignore if field doesn't exist
    }
  }
  return [];
}

async function writeDocsToStaging(collection: string, docs: FirestoreDoc[], dryRun: boolean) {
  if (dryRun) {
    console.log(`[DRY RUN] Would write ${docs.length} docs to ${collection}`);
    return;
  }
  const batchSize = 400; // Firestore max is 500
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = stagingDb.batch();
    for (const doc of docs.slice(i, i + batchSize)) {
      const ref = stagingDb.collection(collection).doc(doc.id);
      batch.set(ref, doc.data, { merge: true });
    }
    await batch.commit();
    console.log(`Wrote batch of ${Math.min(batchSize, docs.length - i)} to ${collection}`);
  }
}

// --- Main ---
(async () => {
  const { month, dryRun } = argv;
  const range = getMonthRange(month);
  console.log(`Syncing data for month: ${month} (${range.start.toDate().toISOString()} - ${range.end.toDate().toISOString()})`);
  for (const collection of COLLECTIONS) {
    console.log(`\nProcessing collection: ${collection}`);
    const docs = await queryMonthlyDocs(prodDb, collection, range);
    console.log(`Found ${docs.length} docs in ${collection} for ${month}`);
    await writeDocsToStaging(collection, docs, dryRun);
  }
  await prodApp.delete();
  await stagingApp.delete();
  console.log('Sync complete.');
})(); 