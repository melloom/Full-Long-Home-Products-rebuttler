import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Super Admin credentials - CHANGE THESE!
const SUPER_ADMIN_EMAIL = "your-email@example.com";
const SUPER_ADMIN_PASSWORD = "your-secure-password";

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin account...');
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      SUPER_ADMIN_EMAIL, 
      SUPER_ADMIN_PASSWORD
    );
    
    const user = userCredential.user;
    console.log('✅ User account created:', user.uid);
    
    // Create super admin document
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
      createdAt: new Date(),
      lastLogin: null,
      isActive: true
    };
    
    await setDoc(doc(db, 'super-admins', user.uid), superAdminData);
    console.log('✅ Super admin document created');
    
    console.log('🎉 Super Admin setup complete!');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password:', SUPER_ADMIN_PASSWORD);
    console.log('🔗 Login URL: /admin/saas-login');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  User already exists. Creating super admin document...');
      
      // If user exists, just create the super admin document
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
        createdAt: new Date(),
        lastLogin: null,
        isActive: true
      };
      
      // You'll need to get the user ID manually if the user already exists
      console.log('⚠️  Please provide the user ID for the existing user');
      console.log('You can find it in Firebase Console > Authentication > Users');
    }
  }
}

// Run the script
createSuperAdmin();