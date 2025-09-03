const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

const EMAILS = [
  'manager@longhome.com',
  'admin2@longhome.com',
  'melloww@gmail.com',
  'longhome@admin.com',
  'ho@gmail.com',
  'melvin.a.p.cruz@gmail.com',
  'admin@longhome.com',
  'mello@gmail.com',
  'mel@gmail.com'
];

async function deleteAdminsByEmail() {
  try {
    console.log('🗑️ Deleting regular admins by email...');

    for (const email of EMAILS) {
      const snap = await db.collection('admins').where('email', '==', email).get();
      if (snap.empty) {
        console.log(`⚠️ No admin doc found for: ${email}`);
        continue;
      }
      for (const doc of snap.docs) {
        await db.collection('admins').doc(doc.id).delete();
        console.log(`✅ Deleted admin: ${email} (docId: ${doc.id})`);
      }
    }

    // Summary
    const remaining = await db.collection('admins').get();
    console.log(`\n📊 Remaining admins: ${remaining.size}`);
    remaining.forEach(d => console.log(` - ${d.data().email}`));

    console.log('\n🎉 Deletion completed.');
  } catch (err) {
    console.error('❌ Error deleting admins:', err);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

deleteAdminsByEmail();
