import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the staging service account key
const serviceAccount = await import(path.resolve(__dirname, '../serviceAccountKey.staging.json'), { assert: { type: "json" } }).then(m => m.default);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migratePaidByField() {
  const expensesRef = db.collection('expenses');
  const snapshot = await expensesRef.get();

  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.paidByUserId && !data.paidById) {
      await doc.ref.update({
        paidById: data.paidByUserId,
      });
      await doc.ref.update({
        paidByUserId: admin.firestore.FieldValue.delete(),
      });
      updatedCount++;
      console.log(`Updated doc ${doc.id}: paidByUserId → paidById`);
    } else {
      skippedCount++;
    }
  }

  console.log(`Migration complete. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
  process.exit(0);
}

migratePaidByField().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 