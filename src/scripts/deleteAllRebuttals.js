import { db } from '../services/firebase/nodeConfig.js';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

const deleteAllRebuttals = async () => {
  try {
    console.log('Starting deletion of all rebuttals...');
    
    // Get all rebuttals
    const rebuttalsRef = collection(db, 'rebuttals');
    const querySnapshot = await getDocs(rebuttalsRef);
    
    if (querySnapshot.empty) {
      console.log('No rebuttals found in the database.');
      return;
    }
    
    console.log(`Found ${querySnapshot.size} rebuttals to delete.`);
    
    // Use batch write for better performance and atomicity
    const batch = writeBatch(db);
    
    // Add all deletions to the batch
    querySnapshot.docs.forEach((doc) => {
      console.log(`Marking rebuttal for deletion: ${doc.id}`);
      batch.delete(doc.ref);
    });
    
    // Execute the batch
    await batch.commit();
    
    console.log(`Successfully deleted ${querySnapshot.size} rebuttals from the database.`);
    
    // Also check for archived rebuttals
    const archivedRef = collection(db, 'archived_rebuttals');
    const archivedSnapshot = await getDocs(archivedRef);
    
    if (!archivedSnapshot.empty) {
      console.log(`Found ${archivedSnapshot.size} archived rebuttals to delete.`);
      
      const archivedBatch = writeBatch(db);
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