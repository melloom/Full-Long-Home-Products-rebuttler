const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

// Company structure data
const COMPANIES = [
  {
    id: 'company-001',
    name: 'Long Home Products',
    email: 'info@longhome.com',
    industry: 'Home Improvement',
    plan: 'professional',
    status: 'active'
  }
];

// Company Admins (one per company, can have multiple)
const COMPANY_ADMINS = [
  {
    email: 'companyadmin@longhome.com',
    password: 'CompanyAdmin2024!',
    name: 'Company Admin',
    companyId: 'company-001',
    role: 'company-admin'
  }
];

// Regular Admins (under company admins)
const REGULAR_ADMINS = [
  {
    email: 'admin@longhome.com',
    password: 'Admin2024!',
    name: 'Regular Admin',
    companyId: 'company-001',
    role: 'admin'
  },
  {
    email: 'admin2@longhome.com',
    password: 'Admin2024!',
    name: 'Second Admin',
    companyId: 'company-001',
    role: 'admin'
  }
];

// Regular Users
const REGULAR_USERS = [
  {
    email: 'user@longhome.com',
    password: 'User2024!',
    name: 'Regular User',
    companyId: 'company-001',
    role: 'user'
  },
  {
    email: 'user2@longhome.com',
    password: 'User2024!',
    name: 'Second User',
    companyId: 'company-001',
    role: 'user'
  }
];

async function createUser(adminUser) {
  try {
    const userRecord = await admin.auth().createUser({
      email: adminUser.email,
      password: adminUser.password,
      displayName: adminUser.name,
      emailVerified: true
    });
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  User ${adminUser.email} already exists, getting UID...`);
      const userRecord = await admin.auth().getUserByEmail(adminUser.email);
      return userRecord.uid;
    }
    throw error;
  }
}

async function setupCompanyStructure() {
  try {
    console.log('🚀 Setting up company structure...\n');

    // 1. Create Companies
    console.log('📊 Creating companies...');
    for (const company of COMPANIES) {
      const companyData = {
        ...company,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('companies').doc(company.id).set(companyData, { merge: true });
      console.log(`✅ Company created: ${company.name} (${company.id})`);
    }

    // 2. Create Company Admins
    console.log('\n👑 Creating company admins...');
    for (const companyAdmin of COMPANY_ADMINS) {
      const uid = await createUser(companyAdmin);
      
      const companyAdminData = {
        email: companyAdmin.email,
        name: companyAdmin.name,
        companyId: companyAdmin.companyId,
        role: 'company-admin',
        permissions: [
          'manage-users',
          'manage-rebuttals',
          'manage-categories',
          'view-analytics',
          'manage-platforms'
        ],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('company-admins').doc(uid).set(companyAdminData);
      console.log(`✅ Company Admin created: ${companyAdmin.name} (${companyAdmin.email})`);
    }

    // 3. Create Regular Admins
    console.log('\n👨‍💼 Creating regular admins...');
    for (const regularAdmin of REGULAR_ADMINS) {
      const uid = await createUser(regularAdmin);
      
      const adminData = {
        email: regularAdmin.email,
        name: regularAdmin.name,
        companyId: regularAdmin.companyId,
        role: 'admin',
        permissions: [
          'manage-rebuttals',
          'manage-categories',
          'view-analytics'
        ],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('admins').doc(uid).set(adminData);
      console.log(`✅ Regular Admin created: ${regularAdmin.name} (${regularAdmin.email})`);
    }

    // 4. Create Regular Users
    console.log('\n👥 Creating regular users...');
    for (const user of REGULAR_USERS) {
      const uid = await createUser(user);
      
      const userData = {
        email: user.email,
        name: user.name,
        companyId: user.companyId,
        role: 'user',
        permissions: [],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(uid).set(userData);
      console.log(`✅ Regular User created: ${user.name} (${user.email})`);
    }

    // 5. Create Platform for Long Home
    console.log('\n🎯 Creating platform...');
    const platformData = {
      name: 'Long Home Training',
      companyId: 'company-001',
      domain: 'longhome.stayonscript.app',
      theme: 'dark',
      status: 'active',
      features: {
        rebuttals: true,
        dispositions: true,
        customerService: true,
        faq: true,
        scheduling: true
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const platformRef = await db.collection('platforms').add(platformData);
    console.log(`✅ Platform created: Long Home Training (${platformRef.id})`);

    console.log('\n🎉 Company structure setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Companies: ${COMPANIES.length}`);
    console.log(`   Company Admins: ${COMPANY_ADMINS.length}`);
    console.log(`   Regular Admins: ${REGULAR_ADMINS.length}`);
    console.log(`   Regular Users: ${REGULAR_USERS.length}`);
    console.log(`   Platforms: 1`);

    console.log('\n🔑 Login Credentials:');
    console.log('   Company Admin: companyadmin@longhome.com / CompanyAdmin2024!');
    console.log('   Regular Admin: admin@longhome.com / Admin2024!');
    console.log('   Regular User: user@longhome.com / User2024!');

  } catch (error) {
    console.error('❌ Error setting up company structure:', error);
  } finally {
    process.exit();
  }
}

setupCompanyStructure();