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

async function exportCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  writeFileSync(join(__dirname, `${collectionName}.json`), JSON.stringify(data, null, 2));
  console.log(`Exported ${data.length} documents from ${collectionName}`);
}

async function main() {
  await exportCollection('categories');
  await exportCollection('locations');
  process.exit(0);
}

main(); 