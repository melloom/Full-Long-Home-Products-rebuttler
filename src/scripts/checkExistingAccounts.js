import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Current Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBRv9bUTYlueDw3AqQQC8zE5yVvGbkEdec",
  authDomain: "long-home-c034d.firebaseapp.com",
  projectId: "long-home-c034d",
  storageBucket: "long-home-c034d.firebasestorage.app",
  messagingSenderId: "1008881201767",
  appId: "1:1008881201767:web:27034cec932f31526f9ac2",
  measurementId: "G-6DKNSCXY5V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const checkExistingData = async () => {
  try {
    console.log('🔍 Checking existing data in Firebase project: long-home-c034d');
    
    // Check Firestore collections
    const collections = ['rebuttals', 'categories', 'admins', 'users'];
    const firestoreData = {};
    
    for (const collectionName of collections) {
      console.log(`\n📊 Checking ${collectionName} collection...`);
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const documents = [];
        
        querySnapshot.forEach((doc) => {
          documents.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        firestoreData[collectionName] = documents;
        console.log(`✅ Found ${documents.length} documents in ${collectionName}`);
        
        if (documents.length > 0) {
          console.log('Sample documents:');
          documents.slice(0, 3).forEach((doc, index) => {
            console.log(`  ${index + 1}. ID: ${doc.id}`);
            if (doc.email) console.log(`     Email: ${doc.email}`);
            if (doc.role) console.log(`     Role: ${doc.role}`);
            if (doc.title) console.log(`     Title: ${doc.title}`);
          });
        }
      } catch (error) {
        console.log(`❌ Error accessing ${collectionName}:`, error.message);
      }
    }
    
    console.log('\n📋 Summary:');
    Object.entries(firestoreData).forEach(([collection, docs]) => {
      console.log(`  ${collection}: ${docs.length} documents`);
    });
    
    // Save results to file
    const fs = await import('fs');
    const path = await import('path');
    
    const resultsPath = path.join(process.cwd(), 'existing-data-check.json');
    fs.writeFileSync(resultsPath, JSON.stringify(firestoreData, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
};

checkExistingData(); 