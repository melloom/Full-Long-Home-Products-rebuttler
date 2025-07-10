import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBRv9bUTYlueDw3AqQQC8zE5yVvGbkEdec',
  authDomain: 'long-home-c034d.firebaseapp.com',
  projectId: 'long-home-c034d',
  storageBucket: 'long-home-c034d.firebasestorage.app',
  messagingSenderId: '1008881201767',
  appId: '1:1008881201767:web:27034cec932f31526f9ac2',
  measurementId: 'G-6DKNSCXY5V'
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 