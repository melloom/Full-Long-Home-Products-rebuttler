const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

const USER_EMAILS = [
  'user2@longhome.com',
  'user@longhome.com'
];

async function deleteRegularUsers() {
  try {
    console.log('🗑️ Deleting regular users...\n');

    for (const email of USER_EMAILS) {
      const snap = await db.collection('users').where('email', '==', email).get();
      if (snap.empty) {
        console.log(`⚠️ No user doc found for: ${email}`);
        continue;
      }
      for (const doc of snap.docs) {
        await db.collection('users').doc(doc.id).delete();
        console.log(`✅ Deleted user: ${email} (docId: ${doc.id})`);
      }
    }

    // Summary
    const remaining = await db.collection('users').get();
    console.log(`\n📊 Remaining users: ${remaining.size}`);
    remaining.forEach(d => console.log(` - ${d.data().email}`));

    console.log('\n🎉 User deletion completed.');
  } catch (err) {
    console.error('❌ Error deleting users:', err);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

deleteRegularUsers();