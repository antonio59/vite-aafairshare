import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const db = admin.firestore();

async function exportSettlements() {
  const snapshot = await db.collection('settlements').get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  writeFileSync(join(__dirname, 'settlements.json'), JSON.stringify(data, null, 2));
  console.log(`Exported ${data.length} settlements`);
}

exportSettlements(); 