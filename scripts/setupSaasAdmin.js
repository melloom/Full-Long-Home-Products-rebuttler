// SaaS Admin Setup Script
// Run this script to create your super admin account

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

// IMPORTANT: Change these to your desired super admin credentials
const SUPER_ADMIN_EMAIL = "melvin@longhome.com";
const SUPER_ADMIN_PASSWORD = "LongHomeAdmin2024!";

async function setupSuperAdmin() {
  try {
    console.log('🚀 Setting up SaaS Super Admin...');
    
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
    console.log('✅ Super admin document created');
    
    // Sign out
    await auth.signOut();
    
    console.log('\n🎉 SaaS Super Admin setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password:', SUPER_ADMIN_PASSWORD);
    console.log('🔗 Login URL: /admin/saas-login');
    console.log('🔗 Dashboard URL: /admin/saas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Next Steps:');
    console.log('1. Update your Firebase config in this script');
    console.log('2. Deploy the Firestore rules from firestore-saas-rules.rules');
    console.log('3. Test the login at /admin/saas-login');
    console.log('4. Access the dashboard at /admin/saas');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your Firebase config is correct');
    console.log('2. Ensure Firestore is enabled in your Firebase project');
    console.log('3. Check that Authentication is enabled');
    console.log('4. Verify your project ID and API keys');
  }
}

// Run the setup
setupSuperAdmin();