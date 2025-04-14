// Ensure React is imported first
import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';

// Register service worker for PWA - Commented out for now
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        // Log error but don't break the app
        console.warn('Service Worker registration failed:', error);
      });
  });
}
*/

// Wait for DOM to be fully loaded
const renderApp = () => {
  const container = document.getElementById("root");
  if (!container) {
    console.error("Root element not found!");
    return;
  }

  // Create root and render app
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <FeatureFlagProvider>
            <App />
          </FeatureFlagProvider>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

// Call the renderApp function
renderApp();
