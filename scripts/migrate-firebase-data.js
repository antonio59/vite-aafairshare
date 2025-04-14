import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin for both projects
const sourceServiceAccount = JSON.parse(fs.readFileSync(new URL('../serviceAccountKey.json', import.meta.url)));
const targetServiceAccount = JSON.parse(fs.readFileSync(new URL('../serviceAccountKey.staging.json', import.meta.url)));

// Source (Production) Firebase Admin initialization
const sourceAdmin = admin.initializeApp({
  credential: admin.credential.cert(sourceServiceAccount)
}, 'source');

// Target (Staging) Firebase Admin initialization
const targetAdmin = admin.initializeApp({
  credential: admin.credential.cert(targetServiceAccount)
}, 'target');

// Get Firestore instances
const sourceDb = sourceAdmin.firestore();
const targetDb = targetAdmin.firestore();

// Get Auth instances
const sourceAuth = sourceAdmin.auth();
const targetAuth = targetAdmin.auth();

// Backup directory
const backupDir = path.join(__dirname, '../backup');

async function exportCollection(collectionName) {
  const snapshot = await sourceDb.collection(collectionName).get();
  const data = [];
  snapshot.forEach(doc => {
    data.push({
      id: doc.id,
      data: doc.data()
    });
  });
  return data;
}

async function importCollection(collectionName, data) {
  const batch = targetDb.batch();
  for (const item of data) {
    const ref = targetDb.collection(collectionName).doc(item.id);
    batch.set(ref, item.data);
  }
  await batch.commit();
}

async function exportUsers() {
  const users = [];
  let pageToken;
  do {
    const listUsersResult = await sourceAuth.listUsers(1000, pageToken);
    users.push(...listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      customClaims: user.customClaims
    })));
    pageToken = listUsersResult.pageToken;
  } while (pageToken);
  return users;
}

async function importUsers(users) {
  for (const user of users) {
    try {
      await targetAuth.createUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      if (user.customClaims) {
        await targetAuth.setCustomUserClaims(user.uid, user.customClaims);
      }
    } catch (error) {
      console.error(`Error importing user ${user.email}:`, error);
    }
  }
}

async function backupData(data, filename) {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backupDir, filename),
    JSON.stringify(data, null, 2)
  );
}

async function migrateData() {
  try {
    // Export and backup users
    console.log('Exporting users...');
    const users = await exportUsers();
    await backupData(users, 'users.json');

    // Export and backup collections
    const collections = ['expenses', 'settlements', 'recurring', 'categories', 'locations', 'mail', 'templates', 'test', 'users'];
    for (const collection of collections) {
      console.log(`Exporting ${collection}...`);
      const data = await exportCollection(collection);
      await backupData(data, `${collection}.json`);
    }

    // Import users
    console.log('Importing users...');
    await importUsers(users);

    // Import collections
    for (const collection of collections) {
      console.log(`Importing ${collection}...`);
      const data = JSON.parse(
        fs.readFileSync(path.join(backupDir, `${collection}.json`))
      );
      await importCollection(collection, data);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Cleanup
    await sourceAdmin.delete();
    await targetAdmin.delete();
  }
}

migrateData();