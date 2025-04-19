import { initializeApp, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';

const SERVICE_ACCOUNT_PROD = '/Users/antoniosmith/Projects/vite-aafairshare/serviceAccountKey.json';
const SERVICE_ACCOUNT_STAGING = '/Users/antoniosmith/Projects/vite-aafairshare/serviceAccountKey.staging.json';
const COLLECTIONS = [
  'categories',
  'locations',
  'expenses',
  'settlements',
];
const DATE_FIELDS = ['date', 'timestamp'];

interface FirestoreDoc<T = Record<string, unknown>> {
  id: string;
  data: T;
}

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
  for (const field of DATE_FIELDS) {
    try {
      const snap = await db.collection(collection)
        .where(field, '>=', range.start)
        .where(field, '<', range.end)
        .get();
      if (!snap.empty) {
        return snap.docs.map(doc => ({ id: doc.id, data: doc.data() }));
      }
    } catch {
      // Ignore if field doesn't exist
    }
  }
  return [];
}

async function writeDocsToStaging(stagingDb: Firestore, collection: string, docs: FirestoreDoc[]) {
  const batchSize = 400;
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

export async function syncMonthlyDataToStaging(month: string): Promise<void> {
  console.log(`[Sync] Starting sync for month: ${month}`);
  const prodApp = initializeApp({ credential: cert(JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PROD, 'utf8')) as ServiceAccount) }, 'prod');
  const stagingApp = initializeApp({ credential: cert(JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_STAGING, 'utf8')) as ServiceAccount) }, 'staging');
  const prodDb = getFirestore(prodApp);
  const stagingDb = getFirestore(stagingApp);
  const range = getMonthRange(month);

  for (const collection of COLLECTIONS) {
    console.log(`[Sync] Processing collection: ${collection}`);
    const docs = await queryMonthlyDocs(prodDb, collection, range);
    console.log(`[Sync] Found ${docs.length} docs in ${collection} for ${month}`);
    await writeDocsToStaging(stagingDb, collection, docs);
  }
  console.log('[Sync] Sync complete.');
} 