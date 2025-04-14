// console.log("--- firebase.ts module executing ---"); // Add this log
/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth"; // Revert to getAuth and setPersistence
import { getFirestore, Firestore } from "firebase/firestore";

// --- NEW Firebase Configuration ---
// Load config from environment variables (Vite convention: prefix with VITE_)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Basic validation to ensure environment variables are loaded
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase configuration environment variables are missing!");
  // You might want to throw an error or handle this case more gracefully
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase only if it hasn't been initialized yet
if (getApps().length === 0) {
  console.log("Initializing Firebase..."); // Keep or modify this log
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Add custom settings for localhost in staging mode
  if (window.location.hostname === 'localhost') {
    console.log("Running on localhost - applying special auth settings");
    // This ensures redirect URLs use the full origin including port
    auth.useDeviceLanguage();
    // Log Firebase config for debugging
    console.log("Firebase config:", {
      ...firebaseConfig,
      currentOrigin: window.location.origin
    });
  }

  // Configure auth persistence only during the initial setup
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      // console.log("Firebase auth persistence set.");
    })
    .catch((error) => {
      console.error("Error setting Firebase auth persistence:", error);
    });
} else {
  console.log("Firebase already initialized. Getting existing app instance."); // Keep or modify
  app = getApp(); // Get the existing app instance
  auth = getAuth(app);
  db = getFirestore(app);
}
 
// Removed emulator connection logic
 
// Export the initialized services
export { app, auth, db };
