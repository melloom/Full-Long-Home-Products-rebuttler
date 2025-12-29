const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

async function removeDuplicateAdmins() {
  try {
    console.log('🔍 Checking for duplicate admins...\n');

    // 1. Get all company admins
    const companyAdminsSnapshot = await db.collection('company-admins').get();
    const companyAdmins = companyAdminsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`👑 Company Admins (${companyAdmins.length}):`);
    companyAdmins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });

    // 2. Get all regular admins
    const adminsSnapshot = await db.collection('admins').get();
    const regularAdmins = adminsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`\n👨‍💼 Regular Admins (${regularAdmins.length}):`);
    regularAdmins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });

    // 3. Find duplicates (same email in both collections)
    const companyAdminEmails = new Set(companyAdmins.map(admin => admin.email));
    const duplicates = regularAdmins.filter(admin => companyAdminEmails.has(admin.email));

    console.log(`\n🔄 Found ${duplicates.length} duplicate(s):`);
    duplicates.forEach(duplicate => {
      console.log(`   - ${duplicate.name} (${duplicate.email})`);
    });

    // 4. Remove duplicates from regular admins collection
    for (const duplicate of duplicates) {
      await db.collection('admins').doc(duplicate.id).delete();
      console.log(`🗑️ Removed duplicate: ${duplicate.name} (${duplicate.email}) from admins collection`);
    }

    // 5. Final summary
    console.log('\n📊 Final Clean Hierarchy:');
    
    const finalCompanyAdmins = await db.collection('company-admins').get();
    const finalAdmins = await db.collection('admins').get();
    const finalUsers = await db.collection('users').get();
    const finalSuperAdmins = await db.collection('super-admins').get();

    console.log(`\n👑 Company Admins (${finalCompanyAdmins.size}):`);
    finalCompanyAdmins.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.email}) - ${data.permissions?.length || 0} permissions`);
    });

    console.log(`\n👨‍💼 Regular Admins (${finalAdmins.size}):`);
    finalAdmins.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.email}) - ${data.permissions?.length || 0} permissions`);
    });

    console.log(`\n👥 Regular Users (${finalUsers.size}):`);
    finalUsers.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.email})`);
    });

    console.log(`\n🔧 Super Admins (${finalSuperAdmins.size}):`);
    finalSuperAdmins.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.email}) - ${data.permissions?.length || 0} permissions`);
    });

    console.log('\n🎉 Duplicate removal completed successfully!');

  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
  } finally {
    process.exit();
  }
}

removeDuplicateAdmins();