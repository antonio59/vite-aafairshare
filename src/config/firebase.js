// Firebase configuration for different environments
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim()
};

// Initialize Firebase
const environment = import.meta.env.VITE_FIREBASE_ENVIRONMENT || 'development';
console.log('Initializing Firebase in environment:', environment);

// Validate configuration before initialization
const validateConfig = (config) => {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = required.filter(field => !config[field] || config[field] === 'undefined' || config[field] === '');
  if (missing.length > 0) {
    console.error(`Missing required Firebase configuration fields: ${missing.join(', ')}`);
    console.error('Current environment:', environment);
    console.error('Available config keys:', Object.keys(config));
    console.error('Config values:', JSON.stringify(config, null, 2));
    throw new Error(`Firebase configuration error: Missing required fields. Please check your .env.${environment} file`);
  }
  return true;
};

const config = firebaseConfig;
validateConfig(config);

console.log('Firebase initializing with environment:', environment);
const app = initializeApp(config);

// Initialize Firebase services
export const auth = getAuth(app);

// Configure Google Auth Provider persistence
auth.setPersistence = auth.setPersistence || (() => Promise.resolve());

// Initialize Firestore
export const db = getFirestore(app);

// Export the Google provider for direct use
export const googleProvider = new GoogleAuthProvider();
// Add scopes for better user data access if needed
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

export default app;