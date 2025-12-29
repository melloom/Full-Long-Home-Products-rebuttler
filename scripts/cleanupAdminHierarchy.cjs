const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

async function cleanupAdminHierarchy() {
  try {
    console.log('🧹 Cleaning up admin hierarchy...\n');

    // 1. Get the main company
    const companiesSnapshot = await db.collection('companies').get();
    const longHomeCompany = companiesSnapshot.docs.find(doc => 
      doc.data().name?.toLowerCase().includes('long home')
    );

    if (!longHomeCompany) {
      throw new Error('Long Home company not found');
    }

    console.log(`🎯 Using company: ${longHomeCompany.data().name} (${longHomeCompany.id})`);

    // 2. Clean up company-admins collection
    console.log('\n👑 Cleaning up company-admins collection...');
    const companyAdminsSnapshot = await db.collection('company-admins').get();
    
    for (const doc of companyAdminsSnapshot.docs) {
      const data = doc.data();
      
      // Ensure proper structure
      const cleanData = {
        email: data.email,
        name: data.name || 'Company Admin',
        companyId: longHomeCompany.id,
        role: 'company-admin',
        permissions: [
          'manage-users',
          'manage-rebuttals',
          'manage-categories',
          'view-analytics',
          'manage-platforms'
        ],
        isActive: true,
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('company-admins').doc(doc.id).set(cleanData);
      console.log(`✅ Updated company admin: ${cleanData.name} (${cleanData.email})`);
    }

    // 3. Clean up admins collection
    console.log('\n👨‍💼 Cleaning up admins collection...');
    const adminsSnapshot = await db.collection('admins').get();
    
    for (const doc of adminsSnapshot.docs) {
      const data = doc.data();
      
      // Skip super admins (they should be in super-admins collection)
      if (data.email?.includes('superadmin')) {
        console.log(`⚠️ Skipping super admin: ${data.email}`);
        continue;
      }

      // Ensure proper structure
      const cleanData = {
        email: data.email,
        name: data.name || 'Admin',
        companyId: longHomeCompany.id,
        role: 'admin',
        permissions: [
          'manage-rebuttals',
          'manage-categories',
          'view-analytics'
        ],
        isActive: true,
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('admins').doc(doc.id).set(cleanData);
      console.log(`✅ Updated regular admin: ${cleanData.name} (${cleanData.email})`);
    }

    // 4. Move super admin to correct collection
    console.log('\n🔧 Moving super admin to correct collection...');
    const superAdminDoc = adminsSnapshot.docs.find(doc => 
      doc.data().email?.includes('superadmin')
    );

    if (superAdminDoc) {
      const superAdminData = {
        email: superAdminDoc.data().email,
        name: 'Super Administrator',
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
        isActive: true,
        createdAt: superAdminDoc.data().createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('super-admins').doc(superAdminDoc.id).set(superAdminData);
      await db.collection('admins').doc(superAdminDoc.id).delete();
      console.log(`✅ Moved super admin to super-admins collection: ${superAdminData.email}`);
    }

    // 5. Clean up users collection
    console.log('\n👥 Cleaning up users collection...');
    const usersSnapshot = await db.collection('users').get();
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      
      // Ensure proper structure
      const cleanData = {
        email: data.email,
        name: data.name || 'User',
        companyId: longHomeCompany.id,
        role: 'user',
        permissions: [],
        isActive: true,
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(doc.id).set(cleanData);
      console.log(`✅ Updated user: ${cleanData.name} (${cleanData.email})`);
    }

    // 6. Final summary
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

    console.log('\n🎉 Admin hierarchy cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit();
  }
}

cleanupAdminHierarchy();