import { db, auth } from '../services/firebase/config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';

// Helper: sign in as admin (if needed, add your sign-in logic here)
async function signIn() {
  // If using Firebase Auth, import signInWithEmailAndPassword from 'firebase/auth'
  // and sign in here if not already signed in.
  // Example:
  // import { signInWithEmailAndPassword } from 'firebase/auth';
  // await signInWithEmailAndPassword(auth, 'admin@email.com', 'password');
}

async function testRebuttalCRUD() {
  try {
    await signIn();

    // 1. Add a test rebuttal
    const rebuttalData = {
      title: 'Test Rebuttal',
      category: 'test-category',
      objection: 'Test objection',
      response: { pt1: 'Test response 1', pt2: 'Test response 2' },
      tags: ['test'],
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const rebuttalsRef = collection(db, 'rebuttals');
    const addRes = await addDoc(rebuttalsRef, rebuttalData);
    const rebuttalId = addRes.id;
    console.log('Added rebuttal:', rebuttalId);

    // 2. Edit the rebuttal
    const updatedData = {
      ...rebuttalData,
      title: 'Test Rebuttal (Edited)',
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'rebuttals', rebuttalId), updatedData);
    console.log('Edited rebuttal:', rebuttalId);

    // 3. Archive the rebuttal (move to archived_rebuttals)
    const rebuttalDoc = await getDoc(doc(db, 'rebuttals', rebuttalId));
    if (rebuttalDoc.exists()) {
      const archivedRef = collection(db, 'archived_rebuttals');
      await addDoc(archivedRef, {
        ...rebuttalDoc.data(),
        archivedAt: new Date().toISOString(),
        archivedReason: 'Test archive'
      });
      await deleteDoc(doc(db, 'rebuttals', rebuttalId));
      console.log('Archived rebuttal:', rebuttalId);
    }

    // 4. Unarchive the rebuttal (move back to rebuttals)
    // Find the archived rebuttal
    const archivedSnapshot = await getDocs(collection(db, 'archived_rebuttals'));
    let archivedId = null;
    archivedSnapshot.forEach(docSnap => {
      if (docSnap.data().title === 'Test Rebuttal (Edited)') {
        archivedId = docSnap.id;
      }
    });
    if (archivedId) {
      const archivedDoc = await getDoc(doc(db, 'archived_rebuttals', archivedId));
      if (archivedDoc.exists()) {
        const data = archivedDoc.data();
        await addDoc(rebuttalsRef, {
          ...data,
          archived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await deleteDoc(doc(db, 'archived_rebuttals', archivedId));
        console.log('Unarchived rebuttal:', archivedId);
      }
    }

    // 5. Delete the test rebuttal (from rebuttals)
    // Find the test rebuttal again
    const allRebuttals = await getDocs(rebuttalsRef);
    let testId = null;
    allRebuttals.forEach(docSnap => {
      if (docSnap.data().title === 'Test Rebuttal (Edited)') {
        testId = docSnap.id;
      }
    });
    if (testId) {
      await deleteDoc(doc(db, 'rebuttals', testId));
      console.log('Deleted rebuttal:', testId);
    }

    console.log('✅ All CRUD operations completed successfully!');
  } catch (error) {
    console.error('❌ Error during CRUD test:', error);
  }
}

testRebuttalCRUD(); 