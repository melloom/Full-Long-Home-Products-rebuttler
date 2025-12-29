const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

// Company Admin credentials
const COMPANY_ADMIN_EMAIL = "companyadmin@longhome.com";
const COMPANY_ADMIN_PASSWORD = "CompanyAdmin2024!";
const COMPANY_ADMIN_NAME = "Company Admin";
const COMPANY_ID = "company-001"; // This should be an existing company ID

async function createCompanyAdmin() {
  try {
    console.log('🚀 Creating company admin...');

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: COMPANY_ADMIN_EMAIL,
      password: COMPANY_ADMIN_PASSWORD,
      displayName: COMPANY_ADMIN_NAME,
      emailVerified: true
    });

    console.log('✅ User created successfully:', userRecord.uid);

    // Create company admin document in Firestore
    const companyAdminData = {
      email: COMPANY_ADMIN_EMAIL,
      name: COMPANY_ADMIN_NAME,
      companyId: COMPANY_ID,
      role: 'company-admin',
      permissions: {
        manageUsers: true,
        manageRebuttals: true,
        manageCategories: true,
        viewAnalytics: true
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('company-admins').doc(userRecord.uid).set(companyAdminData);

    console.log('✅ Company admin document created successfully');

    // Also create a company document if it doesn't exist
    const companyData = {
      name: 'Long Home Products',
      email: 'info@longhome.com',
      industry: 'Home Improvement',
      plan: 'professional',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('companies').doc(COMPANY_ID).set(companyData, { merge: true });

    console.log('✅ Company document created/updated successfully');

    console.log('\n🎉 Company Admin created successfully!');
    console.log('📧 Email:', COMPANY_ADMIN_EMAIL);
    console.log('🔑 Password:', COMPANY_ADMIN_PASSWORD);
    console.log('🏢 Company ID:', COMPANY_ID);
    console.log('👤 User ID:', userRecord.uid);

  } catch (error) {
    console.error('❌ Error creating company admin:', error);
  } finally {
    process.exit();
  }
}

createCompanyAdmin();