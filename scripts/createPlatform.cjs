const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

// Long Home platform seed
const COMPANY_ID = 'company-001';

async function createLongHomePlatform() {
  try {
    console.log('🚀 Creating Long Home training platform...');

    // Ensure company exists
    const companyRef = db.collection('companies').doc(COMPANY_ID);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new Error(`Company ${COMPANY_ID} not found. Create the company first.`);
    }

    const platformData = {
      name: 'Long Home Training',
      companyId: COMPANY_ID,
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

    const newRef = await db.collection('platforms').add(platformData);
    console.log('✅ Platform created:', newRef.id);

    console.log('\n🎉 Long Home platform seeded successfully!');
  } catch (error) {
    console.error('❌ Error creating platform:', error.message || error);
  } finally {
    process.exit();
  }
}

createLongHomePlatform();

