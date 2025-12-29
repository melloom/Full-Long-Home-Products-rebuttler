const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Update this path to match your service account file location
const serviceAccountPath = path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-3dcad8b66d.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error('❌ Could not find Firebase service account file at:', serviceAccountPath);
  console.error('   Please ensure the service account JSON file exists.');
  console.error('   You can download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

// Admin credentials - CHANGE THESE TO YOUR DESIRED CREDENTIALS
const ADMINS = {
  superAdmin: {
    email: 'superadmin@longhome.com',
    password: 'SuperAdmin2024!',
    name: 'Super Admin',
    role: 'super-admin'
  },
  companyAdmin: {
    email: 'companyadmin@longhome.com',
    password: 'CompanyAdmin2024!',
    name: 'Company Admin',
    role: 'company-admin',
    companyId: 'company-001' // Long Home company ID
  },
  regularAdmin: {
    email: 'admin@longhome.com',
    password: 'Admin2024!',
    name: 'Regular Admin',
    role: 'admin'
  }
};

async function createAllAdmins() {
  try {
    console.log('🚀 Creating all admin accounts...\n');

    // First, ensure Long Home company exists
    console.log('📋 Checking Long Home company...');
    const companyRef = db.collection('companies').doc('company-001');
    const companyDoc = await companyRef.get();
    
    if (!companyDoc.exists) {
      console.log('⚠️  Long Home company not found. Creating it...');
      await companyRef.set({
        name: 'Long Home Products',
        slug: 'long-home',
        email: 'info@longhome.com',
        industry: 'Home Improvement',
        plan: 'professional',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Long Home company created');
    } else {
      console.log('✅ Long Home company exists');
    }

    // Create Super Admin
    console.log('\n👑 Creating Super Admin...');
    try {
      const superAdminUser = await admin.auth().createUser({
        email: ADMINS.superAdmin.email,
        password: ADMINS.superAdmin.password,
        displayName: ADMINS.superAdmin.name,
        emailVerified: true
      });

      const superAdminData = {
        email: ADMINS.superAdmin.email,
        name: ADMINS.superAdmin.name,
        role: 'super-admin',
        permissions: [
          'create-companies',
          'delete-companies',
          'create-platforms',
          'delete-platforms',
          'manage-users',
          'view-analytics',
          'system-settings',
          'impersonate-companies'
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      await db.collection('super-admins').doc(superAdminUser.uid).set(superAdminData);
      console.log('✅ Super Admin created successfully');
      console.log(`   Email: ${ADMINS.superAdmin.email}`);
      console.log(`   Password: ${ADMINS.superAdmin.password}`);
      console.log(`   UID: ${superAdminUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Super Admin already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Create Company Admin for Long Home
    console.log('\n🏢 Creating Company Admin for Long Home...');
    try {
      const companyAdminUser = await admin.auth().createUser({
        email: ADMINS.companyAdmin.email,
        password: ADMINS.companyAdmin.password,
        displayName: ADMINS.companyAdmin.name,
        emailVerified: true
      });

      const companyAdminData = {
        email: ADMINS.companyAdmin.email,
        name: ADMINS.companyAdmin.name,
        companyId: ADMINS.companyAdmin.companyId,
        role: 'company-admin',
        permissions: [
          'manage-users',
          'manage-rebuttals',
          'manage-categories',
          'view-analytics',
          'manage-platforms'
        ],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      await db.collection('company-admins').doc(companyAdminUser.uid).set(companyAdminData);
      console.log('✅ Company Admin created successfully');
      console.log(`   Email: ${ADMINS.companyAdmin.email}`);
      console.log(`   Password: ${ADMINS.companyAdmin.password}`);
      console.log(`   Company ID: ${ADMINS.companyAdmin.companyId}`);
      console.log(`   UID: ${companyAdminUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Company Admin already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Create Regular Admin
    console.log('\n👨‍💼 Creating Regular Admin...');
    try {
      const regularAdminUser = await admin.auth().createUser({
        email: ADMINS.regularAdmin.email,
        password: ADMINS.regularAdmin.password,
        displayName: ADMINS.regularAdmin.name,
        emailVerified: true
      });

      const regularAdminData = {
        email: ADMINS.regularAdmin.email,
        name: ADMINS.regularAdmin.name,
        role: 'admin',
        displayName: ADMINS.regularAdmin.name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: null,
        isActive: true
      };

      await db.collection('admins').doc(regularAdminUser.uid).set(regularAdminData);
      console.log('✅ Regular Admin created successfully');
      console.log(`   Email: ${ADMINS.regularAdmin.email}`);
      console.log(`   Password: ${ADMINS.regularAdmin.password}`);
      console.log(`   UID: ${regularAdminUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Regular Admin already exists, skipping...');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All admin accounts created successfully!');
    console.log('\n📋 Login Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 SUPER ADMIN:');
    console.log(`   Email: ${ADMINS.superAdmin.email}`);
    console.log(`   Password: ${ADMINS.superAdmin.password}`);
    console.log(`   Login URL: /admin/saas-login`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏢 COMPANY ADMIN (Long Home):');
    console.log(`   Email: ${ADMINS.companyAdmin.email}`);
    console.log(`   Password: ${ADMINS.companyAdmin.password}`);
    console.log(`   Login URL: /admin/login`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 REGULAR ADMIN:');
    console.log(`   Email: ${ADMINS.regularAdmin.email}`);
    console.log(`   Password: ${ADMINS.regularAdmin.password}`);
    console.log(`   Login URL: /admin/login`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error creating admins:', error);
    if (error.code === 'auth/email-already-exists') {
      console.error('   One or more emails already exist. Please use different emails or delete existing accounts.');
    }
  } finally {
    process.exit();
  }
}

createAllAdmins();

