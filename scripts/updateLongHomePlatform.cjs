const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

async function run() {
  try {
    console.log('🔧 Ensuring Long Home company and platform have correct landing config...');

    // 1) Ensure the Long Home company has slug 'long-home'
    const companyId = 'company-001';
    const companyRef = db.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new Error(`Company ${companyId} not found. Create it first.`);
    }
    await companyRef.set({ slug: 'long-home' }, { merge: true });
    console.log('✅ Company slug set to "long-home"');

    // 2) Find Long Home platform and set landingPath to '/app'
    const platformsSnap = await db.collection('platforms').where('companyId', '==', companyId).get();
    if (platformsSnap.empty) {
      throw new Error('No platforms found for company-001. Create the platform first.');
    }
    const batch = db.batch();
    platformsSnap.forEach(doc => {
      batch.set(doc.ref, { landingPath: '/app', homeUrl: '/app' }, { merge: true });
      console.log(`➡️  Set landingPath '/app' on platform ${doc.id}`);
    });
    await batch.commit();
    console.log('✅ Platform landingPath updated to /app');

    console.log('\n🎉 Long Home platform configuration updated successfully.');
  } catch (err) {
    console.error('❌ Update failed:', err.message || err);
  } finally {
    process.exit();
  }
}

run();

