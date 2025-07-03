import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './styles/globals.css';
import { initializeFirebase } from './services/firebase/config';

// Initialize Firebase before rendering the app
const initializeApp = async () => {
  try {
    // Wait for Firebase initialization
    await initializeFirebase();
    
    // Create root and render app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error UI
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="color: red; padding: 20px;">
          Failed to initialize application. Please try refreshing the page.
          <br/>
          Error: ${error.message}
        </div>
      `;
    }
  }
};

// Start the app
initializeApp();