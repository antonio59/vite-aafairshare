import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const { Timestamp } = admin.firestore;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = await import(path.resolve(__dirname, '../serviceAccountKey.staging.json'), { assert: { type: "json" } }).then(m => m.default);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

function toTimestampIfString(val) {
  if (!val) return undefined;
  if (typeof val === 'string') return Timestamp.fromDate(new Date(val));
  if (val.toDate) return val; // Already a Timestamp
  return undefined;
}

async function migrateDateFields() {
  const expensesRef = db.collection('expenses');
  const snapshot = await expensesRef.get();

  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const update = {};
    const createdAt = toTimestampIfString(data.createdAt);
    const updatedAt = toTimestampIfString(data.updatedAt);
    const date = toTimestampIfString(data.date);

    if ((createdAt && typeof data.createdAt === 'string') ||
        (updatedAt && typeof data.updatedAt === 'string') ||
        (date && typeof data.date === 'string')) {
      if (createdAt) update.createdAt = createdAt;
      if (updatedAt) update.updatedAt = updatedAt;
      if (date) update.date = date;
      await doc.ref.update(update);
      updatedCount++;
      console.log(`Updated doc ${doc.id}: converted string dates to Timestamp`);
    } else {
      skippedCount++;
    }
  }

  console.log(`Migration complete. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
  process.exit(0);
}

migrateDateFields().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 