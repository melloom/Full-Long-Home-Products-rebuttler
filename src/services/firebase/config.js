import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED, initializeFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
const validateConfig = (config) => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing Firebase configuration values: ${missingFields.join(', ')}. ` +
      'Please check your .env file and make sure all required Firebase configuration values are set.'
    );
  }
};

// Helper function to check if Firebase is properly initialized
export const checkFirebaseConnection = () => {
  if (!db) {
    throw new Error('Firebase is not properly initialized. Please check your Firebase configuration.');
  }
  return true;
};

// Singleton instances
let app = null;
let auth = null;
let db = null;
let isInitializing = false;
let initializationPromise = null;

// Initialize Firebase and Firestore with persistence
export const initializeFirebase = async () => {
  // If already initialized, return existing instances
  if (app && auth && db) {
    console.log('Firebase already initialized, returning existing instances');
    return { app, auth, db };
  }

  // If initialization is in progress, wait for it
  if (isInitializing) {
    console.log('Firebase initialization in progress, waiting...');
    return initializationPromise;
  }

  // Start initialization
  isInitializing = true;
  initializationPromise = (async () => {
    try {
      validateConfig(firebaseConfig);
      
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      
      // Initialize Auth
      auth = getAuth(app);
      
      // Initialize Firestore with persistence settings
      db = initializeFirestore(app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        experimentalForceOwningTab: true
      });

      // Enable offline persistence with better error handling
      try {
        await enableIndexedDbPersistence(db, {
          synchronizeTabs: false
        });
        console.log('Firebase persistence enabled successfully');
      } catch (error) {
        if (error.code === 'failed-precondition') {
          // If persistence is already enabled in another tab, continue without persistence
          console.warn('Persistence already enabled in another tab, continuing without persistence');
        } else if (error.code === 'unimplemented') {
          console.warn('Browser does not support persistence, continuing without persistence');
        } else {
          console.error('Error enabling persistence:', error);
          // Continue without persistence
        }
      }
      
      console.log('Firebase initialized successfully');
      return { app, auth, db };
    } catch (error) {
      console.error('Firebase initialization error:', error.message);
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  return initializationPromise;
};

// Initialize Firebase immediately
initializeFirebase().catch(error => {
  console.error('Failed to initialize Firebase:', error);
});

export { auth, db };
export default app; 