import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Old Firebase config (the one you were using before)
const oldFirebaseConfig = {
  apiKey: "AIzaSyC_placeholder_key_here",
  authDomain: "chathub-3f128.firebaseapp.com",
  projectId: "chathub-3f128",
  storageBucket: "chathub-3f128.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize old Firebase
const oldApp = initializeApp(oldFirebaseConfig, 'old');
const oldDb = getFirestore(oldApp);

const exportData = async () => {
  try {
    console.log('Starting data export from old Firebase project...');
    
    const collections = ['rebuttals', 'categories', 'admins', 'users'];
    const exportedData = {};
    
    for (const collectionName of collections) {
      console.log(`Exporting ${collectionName}...`);
      const querySnapshot = await getDocs(collection(oldDb, collectionName));
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      exportedData[collectionName] = documents;
      console.log(`Exported ${documents.length} documents from ${collectionName}`);
    }
    
    // Save to file
    const fs = await import('fs');
    const path = await import('path');
    
    const exportPath = path.join(process.cwd(), 'exported-data.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportedData, null, 2));
    
    console.log(`✅ Data exported successfully to: ${exportPath}`);
    console.log('Summary:');
    Object.entries(exportedData).forEach(([collection, docs]) => {
      console.log(`  ${collection}: ${docs.length} documents`);
    });
    
  } catch (error) {
    console.error('Error exporting data:', error);
  }
};

exportData(); 