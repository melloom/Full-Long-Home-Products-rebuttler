import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccountPath = join(__dirname, '../../../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Firebase service account key not found. Please ensure firebase-service-account.json exists in the project root.');
  console.error('You can download this from Firebase Console > Project Settings > Service Accounts > Generate New Private Key');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'long-home-c034d'
  });
}

const db = admin.firestore();

const deleteAllRebuttals = async () => {
  try {
    console.log('Starting deletion of all rebuttals using Admin SDK...');
    
    // Get all rebuttals
    const rebuttalsRef = db.collection('rebuttals');
    const querySnapshot = await rebuttalsRef.get();
    
    if (querySnapshot.empty) {
      console.log('No rebuttals found in the database.');
      return;
    }
    
    console.log(`Found ${querySnapshot.size} rebuttals to delete.`);
    
    // Use batch write for better performance and atomicity
    const batch = db.batch();
    
    // Add all deletions to the batch
    querySnapshot.docs.forEach((doc) => {
      console.log(`Marking rebuttal for deletion: ${doc.id}`);
      batch.delete(doc.ref);
    });
    
    // Execute the batch
    await batch.commit();
    
    console.log(`Successfully deleted ${querySnapshot.size} rebuttals from the database.`);
    
    // Also check for archived rebuttals
    const archivedRef = db.collection('archived_rebuttals');
    const archivedSnapshot = await archivedRef.get();
    
    if (!archivedSnapshot.empty) {
      console.log(`Found ${archivedSnapshot.size} archived rebuttals to delete.`);
      
      const archivedBatch = db.batch();
      archivedSnapshot.docs.forEach((doc) => {
        console.log(`Marking archived rebuttal for deletion: ${doc.id}`);
        archivedBatch.delete(doc.ref);
      });
      
      await archivedBatch.commit();
      console.log(`Successfully deleted ${archivedSnapshot.size} archived rebuttals.`);
    } else {
      console.log('No archived rebuttals found.');
    }
    
    console.log('All rebuttals have been successfully deleted from the database.');
    
  } catch (error) {
    console.error('Error deleting rebuttals:', error);
    throw error;
  }
};

// Run the deletion
deleteAllRebuttals()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 