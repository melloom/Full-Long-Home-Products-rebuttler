import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';

// Firebase configuration for chathub-3f128
const firebaseConfig = {
  apiKey: "AIzaSyC_placeholder_key_here",
  authDomain: "chathub-3f128.firebaseapp.com",
  projectId: "chathub-3f128",
  storageBucket: "chathub-3f128.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const checkDuplicates = async () => {
  try {
    console.log('Checking for duplicate categories...');
    
    // Get all categories
    const categoriesQuery = query(collection(db, 'categories'));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id})`);
    });
    
    // Check for duplicates by name
    const names = categories.map(cat => cat.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      console.log('\nDuplicate category names found:', [...new Set(duplicates)]);
    } else {
      console.log('\nNo duplicate category names found.');
    }
    
    // Check for duplicates by ID
    const ids = categories.map(cat => cat.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      console.log('Duplicate category IDs found:', [...new Set(duplicateIds)]);
    } else {
      console.log('No duplicate category IDs found.');
    }
    
  } catch (error) {
    console.error('Error checking duplicates:', error);
  }
};

checkDuplicates(); 