const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

async function migrateActualAdmins() {
  try {
    console.log('🔍 Fetching actual admins from database...\n');

    // 1. Get all users from Firebase Auth
    const listUsersResult = await admin.auth().listUsers();
    const authUsers = listUsersResult.users;

    console.log(`📊 Found ${authUsers.length} users in Firebase Auth`);

    // 2. Check existing collections
    const companiesSnapshot = await db.collection('companies').get();
    const companies = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`🏢 Found ${companies.length} companies`);

    // 3. Find the main company (Long Home)
    const longHomeCompany = companies.find(c => 
      c.name && c.name.toLowerCase().includes('long home')
    ) || companies[0];

    if (!longHomeCompany) {
      throw new Error('No company found to assign admins to');
    }

    console.log(`🎯 Using company: ${longHomeCompany.name} (${longHomeCompany.id})`);

    // 4. Look for existing admin users in the users collection
    const usersSnapshot = await db.collection('users').get();
    const existingUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`👥 Found ${existingUsers.length} users in users collection`);

    // 5. Find potential admins (look for admin-like emails or names)
    const potentialAdmins = existingUsers.filter(user => {
      const email = user.email?.toLowerCase() || '';
      const name = user.name?.toLowerCase() || '';
      
      return email.includes('admin') || 
             email.includes('manager') || 
             name.includes('admin') ||
             name.includes('manager') ||
             user.role === 'admin' ||
             user.role === 'company-admin';
    });

    console.log(`🔍 Found ${potentialAdmins.length} potential admins in users collection`);

    // 6. Check for tgibbs@longhome.com specifically
    const tgibbsUser = existingUsers.find(user => 
      user.email?.toLowerCase() === 'tgibbs@longhome.com'
    );

    if (tgibbsUser) {
      console.log(`✅ Found tgibbs@longhome.com in users collection`);
      
      // Move tgibbs to company-admins collection
      const companyAdminData = {
        email: tgibbsUser.email,
        name: tgibbsUser.name || 'Company Admin',
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
        createdAt: tgibbsUser.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('company-admins').doc(tgibbsUser.id).set(companyAdminData);
      console.log(`✅ Moved tgibbs@longhome.com to company-admins collection`);

      // Remove from users collection
      await db.collection('users').doc(tgibbsUser.id).delete();
      console.log(`🗑️ Removed tgibbs@longhome.com from users collection`);
    } else {
      console.log(`⚠️ tgibbs@longhome.com not found in users collection`);
    }

    // 7. Move other potential admins to regular admins collection
    for (const user of potentialAdmins) {
      if (user.email?.toLowerCase() === 'tgibbs@longhome.com') {
        continue; // Already handled above
      }

      const adminData = {
        email: user.email,
        name: user.name || 'Admin',
        companyId: longHomeCompany.id,
        role: 'admin',
        permissions: [
          'manage-rebuttals',
          'manage-categories',
          'view-analytics'
        ],
        isActive: true,
        createdAt: user.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('admins').doc(user.id).set(adminData);
      console.log(`✅ Moved ${user.email} to admins collection`);

      // Remove from users collection
      await db.collection('users').doc(user.id).delete();
      console.log(`🗑️ Removed ${user.email} from users collection`);
    }

    // 8. Check Firebase Auth for any admin users not in Firestore
    const authAdmins = authUsers.filter(user => {
      const email = user.email?.toLowerCase() || '';
      return email.includes('admin') || email.includes('manager');
    });

    console.log(`\n🔍 Found ${authAdmins.length} admin users in Firebase Auth`);

    for (const authUser of authAdmins) {
      // Check if already in company-admins or admins collections
      const companyAdminDoc = await db.collection('company-admins').doc(authUser.uid).get();
      const adminDoc = await db.collection('admins').doc(authUser.uid).get();
      const userDoc = await db.collection('users').doc(authUser.uid).get();

      if (companyAdminDoc.exists || adminDoc.exists) {
        console.log(`✅ ${authUser.email} already in admin collections`);
        continue;
      }

      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Determine if this should be a company admin or regular admin
        const isCompanyAdmin = authUser.email?.toLowerCase().includes('company') || 
                              authUser.email?.toLowerCase() === 'tgibbs@longhome.com';

        if (isCompanyAdmin) {
          const companyAdminData = {
            email: authUser.email,
            name: authUser.displayName || 'Company Admin',
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          await db.collection('company-admins').doc(authUser.uid).set(companyAdminData);
          console.log(`✅ Created company admin for ${authUser.email}`);
        } else {
          const adminData = {
            email: authUser.email,
            name: authUser.displayName || 'Admin',
            companyId: longHomeCompany.id,
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

          await db.collection('admins').doc(authUser.uid).set(adminData);
          console.log(`✅ Created regular admin for ${authUser.email}`);
        }

        // Remove from users collection if it exists there
        if (userDoc.exists) {
          await db.collection('users').doc(authUser.uid).delete();
          console.log(`🗑️ Removed ${authUser.email} from users collection`);
        }
      }
    }

    // 9. Final summary
    console.log('\n📊 Final Summary:');
    
    const finalCompanyAdmins = await db.collection('company-admins').get();
    const finalAdmins = await db.collection('admins').get();
    const finalUsers = await db.collection('users').get();

    console.log(`👑 Company Admins: ${finalCompanyAdmins.size}`);
    finalCompanyAdmins.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.email})`);
    });

    console.log(`👨‍💼 Regular Admins: ${finalAdmins.size}`);
    finalAdmins.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.email})`);
    });

    console.log(`👥 Regular Users: ${finalUsers.size}`);
    finalUsers.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.email})`);
    });

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    process.exit();
  }
}

migrateActualAdmins();