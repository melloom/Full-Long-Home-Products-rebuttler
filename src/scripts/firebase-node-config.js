import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for Node.js scripts
const firebaseConfig = {
  apiKey: 'AIzaSyBRv9bUTYlueDw3AqQQC8zE5yVvGbkEdec',
  authDomain: 'long-home-c034d.firebaseapp.com',
  projectId: 'long-home-c034d',
  storageBucket: 'long-home-c034d.firebasestorage.app',
  messagingSenderId: '1008881201767',
  appId: '1:1008881201767:web:27034cec932f31526f9ac2',
  measurementId: 'G-6DKNSCXY5V'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 