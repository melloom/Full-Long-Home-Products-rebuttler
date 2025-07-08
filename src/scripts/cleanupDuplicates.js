import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';

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

const cleanupDuplicates = async () => {
  try {
    console.log('Cleaning up duplicate categories...');
    
    // Get all categories
    const categoriesQuery = query(collection(db, 'categories'));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${categories.length} categories total`);
    
    // Group categories by name
    const categoriesByName = {};
    categories.forEach(cat => {
      if (!categoriesByName[cat.name]) {
        categoriesByName[cat.name] = [];
      }
      categoriesByName[cat.name].push(cat);
    });
    
    // Find and remove duplicates
    let removedCount = 0;
    for (const [name, cats] of Object.entries(categoriesByName)) {
      if (cats.length > 1) {
        console.log(`Found ${cats.length} duplicates for "${name}"`);
        
        // Keep the first one, remove the rest
        const toRemove = cats.slice(1);
        for (const cat of toRemove) {
          console.log(`Removing duplicate category: ${cat.name} (ID: ${cat.id})`);
          await deleteDoc(doc(db, 'categories', cat.id));
          removedCount++;
        }
      }
    }
    
    console.log(`\nCleanup completed! Removed ${removedCount} duplicate categories.`);
    
    // Verify cleanup
    const finalQuery = query(collection(db, 'categories'));
    const finalSnapshot = await getDocs(finalQuery);
    const finalCategories = finalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`\nFinal category count: ${finalCategories.length}`);
    console.log('Remaining categories:');
    finalCategories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id})`);
    });
    
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
  }
};

cleanupDuplicates(); 