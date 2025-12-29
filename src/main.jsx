import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './styles/globals.css';
import initializeIframeErrorHandling from './utils/iframeErrorHandler';

// Global console filtering for external service errors
const setupConsoleFiltering = () => {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  
  // Filter console.log messages (but allow critical initialization logs)
  console.log = (...args) => {
    const message = args.join(' ');
    // Always show critical initialization and error-related logs
    if (message.includes('Starting app initialization') ||
        message.includes('Root element found') ||
        message.includes('Rendering app') ||
        message.includes('App rendered successfully') ||
        message.includes('Failed to initialize') ||
        message.includes('Unregistered service worker') ||
        message.includes('All service workers unregistered') ||
        message.includes('Error') ||
        message.includes('dispatcher') ||
        message.includes('useState') ||
        message.includes('React') ||
        message.includes('AuthContext')) {
      originalConsoleLog(...args);
    } else if (!message.includes('res 65.246.84.74') &&
        !message.includes('got ip') &&
        !message.includes('timeDifference') &&
        !message.includes('firebase mounted') &&
        !message.includes('should call') &&
        !message.includes('called') &&
        !message.includes('Firebase apps') &&
        !message.includes('Initializing Firebase') &&
        !message.includes('Firebase initialized') &&
        !message.includes('Firebase Messaging initialized') &&
        !message.includes('req token') &&
        !message.includes('Requesting permission') &&
        !message.includes('firebase') &&
        !message.includes('worker init') &&
        !message.includes('worker messaging') &&
        !message.includes('loadAppData is resolved') &&
        !message.includes('Click is in the middle bottom') &&
        !message.includes('Click is in the bottom-right corner') &&
        !message.includes('Basemap iframe loaded successfully')) {
      originalConsoleLog(...args);
    }
  };
  
  // Filter console.warn messages
  console.warn = (...args) => {
    const message = args.join(' ');
    if (!message.includes('mapContainer') && 
        !message.includes('Google Maps JavaScript API') &&
        !message.includes('Permissions policy violation') &&
        !message.includes('getNotifications') &&
        !message.includes('Invalid DOM property') &&
        !message.includes('componentWillMount') &&
        !message.includes('componentWillReceiveProps') &&
        !message.includes('ReactDOM.render is no longer supported') &&
        !message.includes('string ref') &&
        !message.includes('strict-mode-string-ref') &&
        !message.includes('mapTypeId_changed') &&
        !message.includes('styles_changed') &&
        !message.includes('google.maps.places.AutocompleteService') &&
        !message.includes('google.maps.places.PlacesService') &&
        !message.includes('google.maps.Marker') &&
        !message.includes('mapId is present') &&
        !message.includes('map styles are controlled via the cloud console') &&
        !message.includes('deprecated') &&
        !message.includes('not available to new customers') &&
        !message.includes('not scheduled to be discontinued') &&
        !message.includes('will continue to receive bug fixes') &&
        !message.includes('at least 12 months notice') &&
        !message.includes('migration guide') &&
        !message.includes('As of March 1st, 2025') &&
        !message.includes('As of February 21st, 2024')) {
      originalConsoleWarn(...args);
    }
  };
  
  // Filter console.error messages (but always show critical errors)
  console.error = (...args) => {
    const message = args.join(' ');
    // Always show critical errors
    if (message.includes('Failed to initialize') ||
        message.includes('dispatcher is null') ||
        message.includes('useState') ||
        message.includes('React') ||
        message.includes('TypeError') ||
        message.includes('ReferenceError') ||
        message.includes('AuthContext') ||
        message.includes('Cannot read') ||
        message.includes('Cannot access')) {
      originalConsoleError(...args);
    } else if (!message.includes('getNotifications') && 
        !message.includes('Geolocation access has been blocked') &&
        !message.includes('InvalidValueError: in property address') &&
        !message.includes('Failed to decode downloaded font') &&
        !message.includes('OTS parsing error') &&
        !message.includes('Failed to load resource') &&
        !message.includes('Uncaught SyntaxError') &&
        !message.includes('InvalidAccessError: Failed to execute') &&
        !message.includes('applicationServerKey is not valid') &&
        !message.includes('Initialization error') &&
        !message.includes('Error while retrieving token') &&
        !message.includes('subscribe on PushManager') &&
        !message.includes('Error getting location') &&
        !message.includes('Geolocation has been disabled') &&
        !message.includes('worker init') &&
        !message.includes('worker messaging') &&
        !message.includes('ReferenceError: getNotifications') &&
        !message.includes('Geolocation has been disabled in this document') &&
        !message.includes('The notification permission was not granted and blocked instead') &&
        !message.includes('messaging/permission-blocked')) {
      originalConsoleError(...args);
    }
  };
};

// Setup console filtering immediately
setupConsoleFiltering();

// Initialize iframe error handling
initializeIframeErrorHandling();

// Also add a global error handler to catch iframe errors
window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (message.includes('getNotifications') ||
      message.includes('Geolocation') ||
      message.includes('applicationServerKey') ||
      message.includes('PushManager') ||
      message.includes('mapContainer') ||
      message.includes('InvalidValueError') ||
      message.includes('ReferenceError') ||
      message.includes('Failed to decode downloaded font') ||
      message.includes('OTS parsing error') ||
      message.includes('The notification permission was not granted and blocked instead') ||
      message.includes('messaging/permission-blocked') ||
      message.includes('Geolocation has been disabled in this document by permissions policy')) {
    event.preventDefault();
    return false;
  }
});

// Add global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.toString() || '';
  
  // Handle Firebase-related promise rejections
  if (reason.includes('Firebase') ||
      reason.includes('auth') ||
      reason.includes('firestore') ||
      reason.includes('messaging') ||
      reason.includes('ServiceWorker') ||
      reason.includes('Cache') ||
      reason.includes('fetch') ||
      reason.includes('getNotifications') ||
      reason.includes('PushManager') ||
      reason.includes('applicationServerKey')) {
    console.log('Handled promise rejection:', reason);
    event.preventDefault();
    return;
  }
  
  // Log unhandled rejections that we don't explicitly handle
  console.warn('Unhandled promise rejection:', event.reason);
});

// Note: Console proxy removed to avoid potential React interference
// Console filtering is handled in setupConsoleFiltering above

// Suppress browser extension errors in development
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Filter out browser extension errors
    const message = args.join(' ');
    if (message.includes('Teflon') || message.includes('contentscript.bundle.js')) {
      return;
    }
    originalConsoleError(...args);
  };
}

// Simple initialization without Firebase dependency
const initializeApp = async () => {
  try {
    console.log('Starting app initialization...');
    
    // In development, unregister any service workers to avoid React conflicts
    // Use a timeout to prevent hanging
    if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      try {
        console.log('Checking for service workers...');
        const swUnregisterPromise = (async () => {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log('Found service worker registrations:', registrations.length);
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Unregistered service worker:', registration.scope);
          }
          // Clear all caches
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('All service workers unregistered and caches cleared');
        })();
        
        // Wait max 3 seconds for service worker unregistration
        await Promise.race([
          swUnregisterPromise,
          new Promise(resolve => setTimeout(() => {
            console.warn('Service worker unregistration timed out, continuing...');
            resolve();
          }, 3000))
        ]);
      } catch (error) {
        console.warn('Error unregistering service workers (continuing anyway):', error.message);
        // Continue even if service worker unregistration fails
      }
    }
    
    // Check if root element exists
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    console.log('Root element found, creating React root...');
    
    // Create root and render app
    const root = ReactDOM.createRoot(rootElement);
    
    console.log('Rendering app...');
    root.render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
    
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error UI
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="color: red; padding: 20px; font-family: Arial, sans-serif;">
          <h2>Failed to initialize application</h2>
          <p>Please try refreshing the page.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Stack:</strong> ${error.stack}</p>
        </div>
      `;
    }
  }
};

// Start the app
console.log('main.jsx loaded, starting initialization...');
initializeApp();