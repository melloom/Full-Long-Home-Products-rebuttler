// Setup Super Admin with specific credentials from super-admin-credentials.txt
// Run this script to create the super admin account with the exact credentials

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyBRv9bUTYlueDw3AqQQC8zE5yVvGbkEdec",
  authDomain: "long-home-c034d.firebaseapp.com",
  projectId: "long-home-c034d",
  storageBucket: "long-home-c034d.firebasestorage.app",
  messagingSenderId: "1008881201767",
  appId: "1:1008881201767:web:27034cec932f31526f9ac2",
  measurementId: "G-6DKNSCXY5V"
};

// Super Admin credentials from super-admin-credentials.txt
const SUPER_ADMIN_EMAIL = "superadmin@longhome.com";
const SUPER_ADMIN_PASSWORD = "SuperAdmin2024!";
const SUPER_ADMIN_UID = "jJdzPB0aRlcTdG1TSrESy0nw4yM2"; // From credentials file

async function setupSuperAdminWithCredentials() {
  try {
    console.log('🚀 Setting up Super Admin with specific credentials...');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password:', SUPER_ADMIN_PASSWORD);
    console.log('🆔 Expected UID:', SUPER_ADMIN_UID);
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    let userId;
    
    try {
      // Try to create the user account
      console.log('📧 Creating user account...');
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        SUPER_ADMIN_EMAIL, 
        SUPER_ADMIN_PASSWORD
      );
      userId = userCredential.user.uid;
      console.log('✅ User account created successfully');
      console.log('🆔 Actual UID:', userId);
      
      if (userId !== SUPER_ADMIN_UID) {
        console.log('⚠️  Warning: Generated UID does not match expected UID from credentials file');
        console.log('Expected:', SUPER_ADMIN_UID);
        console.log('Actual:', userId);
      }
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️  User already exists, signing in...');
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          SUPER_ADMIN_EMAIL, 
          SUPER_ADMIN_PASSWORD
        );
        userId = userCredential.user.uid;
        console.log('✅ Signed in to existing account');
        console.log('🆔 Actual UID:', userId);
        
        if (userId !== SUPER_ADMIN_UID) {
          console.log('⚠️  Warning: Existing UID does not match expected UID from credentials file');
          console.log('Expected:', SUPER_ADMIN_UID);
          console.log('Actual:', userId);
        }
      } else {
        throw error;
      }
    }
    
    // Create super admin document
    console.log('👑 Creating super admin document...');
    const superAdminData = {
      email: SUPER_ADMIN_EMAIL,
      role: 'super-admin',
      permissions: [
        'create-companies',
        'delete-companies', 
        'create-platforms',
        'delete-platforms',
        'manage-users',
        'view-analytics',
        'system-settings'
      ],
      createdAt: serverTimestamp(),
      lastLogin: null,
      isActive: true,
      name: 'Super Administrator'
    };
    
    await setDoc(doc(db, 'super-admins', userId), superAdminData);
    console.log('✅ Super admin document created in super-admins collection');
    
    // Also create in admins collection for backward compatibility
    await setDoc(doc(db, 'admins', userId), {
      ...superAdminData,
      uid: userId
    });
    console.log('✅ Super admin document created in admins collection');
    
    // Sign out
    await auth.signOut();
    
    console.log('\n🎉 Super Admin setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password:', SUPER_ADMIN_PASSWORD);
    console.log('🆔 User ID:', userId);
    console.log('🔗 Login URL: /admin/login');
    console.log('🔗 Dashboard URL: /admin/saas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
    console.error('Error details:', error.message);
  }
}

// Run the script
setupSuperAdminWithCredentials();