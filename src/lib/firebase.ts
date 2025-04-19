// console.log("--- firebase.ts module executing ---"); // Add this log
/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const environment = import.meta.env.VITE_FIREBASE_ENVIRONMENT || 'development';
console.log(`Initializing Firebase in environment: ${environment}`);

// Load config from environment variables (Vite convention: prefix with VITE_)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim()
};

// Basic validation to ensure environment variables are loaded
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase configuration environment variables are missing!");
  console.error("Current environment:", environment);
  console.error("Config:", firebaseConfig);
  throw new Error(`Firebase configuration error: Missing required fields. Please check your .env.${environment} file`);
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase only if it hasn't been initialized yet
if (getApps().length === 0) {
  console.log("Initializing new Firebase instance...");
  console.log("Firebase config:", {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
  });
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Configure auth persistence
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Firebase auth persistence set to browserLocalPersistence");
      
      // Set up auth state listener after persistence is configured
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("Firebase: User is signed in", {
            uid: user.uid,
            email: user.email
          });
        } else {
          console.log("Firebase: No user signed in");
        }
      });
    })
    .catch((error) => {
      console.error("Error setting Firebase auth persistence:", error);
    });

  // Add custom settings for localhost
  if (window.location.hostname === 'localhost') {
    console.log("Running on localhost - applying special auth settings");
    auth.useDeviceLanguage();
  }

  // Debug assignment
  console.log("Setting window.firebaseAppConfig for debugging:", app.options);
  // @ts-ignore
  window.firebaseAppConfig = app.options;
} else {
  console.log("Firebase already initialized. Getting existing app instance.");
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  // Debug assignment
  console.log("Setting window.firebaseAppConfig for debugging:", app.options);
  // @ts-ignore
  window.firebaseAppConfig = app.options;
}

// Create and configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Export the initialized services
export { app, auth, db, googleProvider };

// Expose Firebase app instance for debugging (remove after inspection)
// @ts-ignore
window.firebaseApp = app;
