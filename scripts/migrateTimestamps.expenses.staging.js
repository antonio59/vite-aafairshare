import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = await import(path.resolve(__dirname, '../serviceAccountKey.staging.json'), { assert: { type: "json" } }).then(m => m.default);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateTimestamps() {
  const expensesRef = db.collection('expenses');
  const snapshot = await expensesRef.get();

  let updatedCount = 0;
  let skippedCount = 0;
  const now = new Date().toISOString();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const update = {};
    if (!data.createdAt) update.createdAt = now;
    if (!data.updatedAt) update.updatedAt = now;
    if (Object.keys(update).length > 0) {
      await doc.ref.update(update);
      updatedCount++;
      console.log(`Updated doc ${doc.id}: added missing timestamps`);
    } else {
      skippedCount++;
    }
  }

  console.log(`Migration complete. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
  process.exit(0);
}

migrateTimestamps().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 