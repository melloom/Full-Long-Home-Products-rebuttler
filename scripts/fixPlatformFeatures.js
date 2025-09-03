import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase configuration
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

const defaultFeatures = [
  'User Management',
  'Content Library',
  'Progress Tracking',
  'Analytics Dashboard',
  'Mobile Responsive',
  'Custom Branding',
  'Email Notifications',
  'API Access'
];

async function fixPlatformFeatures() {
  try {
    console.log('🔄 Starting platform features fix...');
    
    // Get all platforms
    const platformsSnapshot = await getDocs(collection(db, 'platforms'));
    console.log(`📊 Found ${platformsSnapshot.docs.length} platforms`);
    
    let fixedCount = 0;
    
    for (const platformDoc of platformsSnapshot.docs) {
      const platformData = platformDoc.data();
      const platformId = platformDoc.id;
      
      console.log(`🔍 Checking platform: ${platformData.name || platformId}`);
      
      // Check if features exist and need fixing
      if (platformData.features) {
        // If features is an array, convert to object
        if (Array.isArray(platformData.features)) {
          console.log(`  ⚠️  Features is array, converting to object...`);
          
          const featuresObject = {};
          platformData.features.forEach(feature => {
            featuresObject[feature] = true;
          });
          
          // Update the platform document
          await updateDoc(doc(db, 'platforms', platformId), {
            features: featuresObject
          });
          
          console.log(`  ✅ Fixed features for platform: ${platformData.name || platformId}`);
          fixedCount++;
        } else if (typeof platformData.features === 'object') {
          console.log(`  ✅ Features already in correct format`);
        }
      } else {
        // If no features exist, add default features
        console.log(`  ⚠️  No features found, adding default features...`);
        
        const featuresObject = {};
        defaultFeatures.forEach(feature => {
          featuresObject[feature] = true;
        });
        
        // Update the platform document
        await updateDoc(doc(db, 'platforms', platformId), {
          features: featuresObject
        });
        
        console.log(`  ✅ Added default features for platform: ${platformData.name || platformId}`);
        fixedCount++;
      }
    }
    
    console.log(`🎉 Platform features fix completed! Fixed ${fixedCount} platforms.`);
    
  } catch (error) {
    console.error('❌ Error fixing platform features:', error);
  }
}

// Run the fix
fixPlatformFeatures();