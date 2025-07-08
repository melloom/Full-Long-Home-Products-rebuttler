import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBRv9bUTYlueDw3AqQQC8zE5yVvGbkEdec",
  authDomain: "long-home-c034d.firebaseapp.com",
  projectId: "long-home-c034d",
  storageBucket: "long-home-c034d.firebasestorage.app",
  messagingSenderId: "1008881201767",
  appId: "1:1008881201767:web:27034cec932f31526f9ac2",
  measurementId: "G-6DKNSCXY5V"
};

const debugAuth = async () => {
  try {
    console.log('🔍 Debug: Initializing Firebase...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    console.log('🔍 Debug: Firebase initialized, checking auth state...');
    
    // Check current user
    const currentUser = auth.currentUser;
    console.log('🔍 Debug: Current user (immediate):', currentUser);
    
    if (currentUser) {
      console.log('🔍 Debug: User details:', {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
        displayName: currentUser.displayName,
        providerData: currentUser.providerData
      });
    }
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔍 Debug: Auth state changed:', user ? `User logged in (${user.email})` : 'No user');
      
      if (user) {
        console.log('🔍 Debug: User details from listener:', {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
          providerData: user.providerData
        });
      }
    });
    
    // Wait a bit and check again
    setTimeout(() => {
      console.log('🔍 Debug: Checking auth state after delay...');
      const delayedUser = auth.currentUser;
      console.log('🔍 Debug: Delayed user check:', delayedUser);
      
      if (delayedUser) {
        console.log('🔍 Debug: Delayed user details:', {
          uid: delayedUser.uid,
          email: delayedUser.email,
          emailVerified: delayedUser.emailVerified,
          displayName: delayedUser.displayName
        });
      }
      
      unsubscribe();
    }, 2000);
    
  } catch (error) {
    console.error('🔍 Debug: Error:', error);
  }
};

// Run the debug function
debugAuth(); 