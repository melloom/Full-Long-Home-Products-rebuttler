import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  doc,
  setDoc 
} from 'firebase/firestore';
import { getDb } from '../services/firebase/config';

/**
 * Debug function to check what collections exist and their structure
 */
export const debugDatabaseStructure = async () => {
  try {
    const db = getDb();
    console.log('🔍 Debugging database structure...');

    // Check companies collection
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    console.log(`📊 Companies collection: ${companiesSnapshot.docs.length} documents`);
    if (companiesSnapshot.docs.length > 0) {
      console.log('Sample company:', companiesSnapshot.docs[0].data());
    }

    // Check super-admins collection
    const superAdminsSnapshot = await getDocs(collection(db, 'super-admins'));
    console.log(`📊 Super-admins collection: ${superAdminsSnapshot.docs.length} documents`);
    if (superAdminsSnapshot.docs.length > 0) {
      console.log('Sample super admin:', superAdminsSnapshot.docs[0].data());
    }

    // Check company-admins collection
    const companyAdminsSnapshot = await getDocs(collection(db, 'company-admins'));
    console.log(`📊 Company-admins collection: ${companyAdminsSnapshot.docs.length} documents`);
    if (companyAdminsSnapshot.docs.length > 0) {
      console.log('Sample company admin:', companyAdminsSnapshot.docs[0].data());
    }

    // Check regular admins collection
    const adminsSnapshot = await getDocs(collection(db, 'admins'));
    console.log(`📊 Admins collection: ${adminsSnapshot.docs.length} documents`);
    if (adminsSnapshot.docs.length > 0) {
      console.log('Sample admin:', adminsSnapshot.docs[0].data());
    }

    // Check users collection
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Users collection: ${usersSnapshot.docs.length} documents`);
    if (usersSnapshot.docs.length > 0) {
      console.log('Sample user:', usersSnapshot.docs[0].data());
    }

    return {
      companies: companiesSnapshot.docs.length,
      superAdmins: superAdminsSnapshot.docs.length,
      companyAdmins: companyAdminsSnapshot.docs.length,
      admins: adminsSnapshot.docs.length,
      users: usersSnapshot.docs.length
    };
  } catch (error) {
    console.error('❌ Error debugging database structure:', error);
    return null;
  }
};

/**
 * Creates sample data for testing if collections are empty
 */
export const createSampleData = async (companyId = null) => {
  try {
    const db = getDb();
    console.log('🔧 Creating sample data...');

    let targetCompanyId = companyId;

    // If no company ID provided, create a sample company first
    if (!targetCompanyId) {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      if (companiesSnapshot.docs.length === 0) {
        console.log('📝 Creating sample company...');
        const companyRef = await addDoc(collection(db, 'companies'), {
          name: 'Sample Company',
          email: 'admin@samplecompany.com',
          industry: 'Technology',
          plan: 'professional',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        targetCompanyId = companyRef.id;
        console.log('✅ Created sample company with ID:', targetCompanyId);
      } else {
        targetCompanyId = companiesSnapshot.docs[0].id;
        console.log('📋 Using existing company with ID:', targetCompanyId);
      }
    }

    // Create sample company admin
    console.log('📝 Creating sample company admin...');
    const companyAdminData = {
      name: 'John Company Admin',
      email: 'john.admin@samplecompany.com',
      companyId: targetCompanyId,  // Primary field
      company_id: targetCompanyId, // Alternative field name (backup)
      role: 'company-admin',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      permissions: ['read', 'write', 'delete'],
      isActive: true
    };
    
    console.log('📝 Company admin data to be created:', companyAdminData);
    await addDoc(collection(db, 'company-admins'), companyAdminData);

    // Create sample users
    console.log('📝 Creating sample users...');
    const sampleUsers = [
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@samplecompany.com',
        role: 'user'
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@samplecompany.com',
        role: 'manager'
      },
      {
        name: 'Carol Davis',
        email: 'carol.davis@samplecompany.com',
        role: 'user'
      }
    ];

    for (const userData of sampleUsers) {
      await addDoc(collection(db, 'users'), {
        ...userData,
        companyId: targetCompanyId,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('✅ Sample data created successfully!');
    return targetCompanyId;
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
};

/**
 * Checks if a company has users and creates sample data if needed
 */
export const ensureCompanyHasUsers = async (companyId, companyName = 'Unknown Company') => {
  try {
    const db = getDb();
    
    // Check if company has any users or admins
    const [adminsSnapshot, companyAdminsSnapshot, usersSnapshot] = await Promise.all([
      getDocs(collection(db, 'admins')),
      getDocs(collection(db, 'company-admins')),
      getDocs(collection(db, 'users'))
    ]);

    const regularAdmins = adminsSnapshot.docs.filter(doc => doc.data().companyId === companyId);
    const companyAdmins = companyAdminsSnapshot.docs.filter(doc => doc.data().companyId === companyId);
    const companyUsers = usersSnapshot.docs.filter(doc => doc.data().companyId === companyId);

    console.log(`🔍 Company ${companyName} (${companyId}) has ${regularAdmins.length} regular admins, ${companyAdmins.length} company admins, and ${companyUsers.length} users`);

    if (regularAdmins.length === 0 && companyAdmins.length === 0 && companyUsers.length === 0) {
      console.log(`📝 Creating sample users for company ${companyName}...`);
      
      // Create a sample company admin
      const companyAdminData = {
        name: `${companyName} Admin`,
        email: `admin@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        companyId: companyId,  // Primary field
        company_id: companyId, // Alternative field name (backup)
        role: 'company-admin',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        permissions: ['read', 'write', 'delete'],
        isActive: true
      };
      
      console.log(`📝 Creating company admin for ${companyName}:`, companyAdminData);
      await addDoc(collection(db, 'company-admins'), companyAdminData);

      // Create sample users
      await addDoc(collection(db, 'users'), {
        name: `Sample User 1`,
        email: `user1@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        companyId: companyId,
        role: 'user',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'users'), {
        name: `Sample User 2`,
        email: `user2@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        companyId: companyId,
        role: 'manager',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Created sample users for company ${companyName}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error ensuring company ${companyId} has users:`, error);
    return false;
  }
};

/**
 * Lists all collections and their document counts
 */
export const listAllCollections = async () => {
  try {
    const db = getDb();
    const collections = ['companies', 'super-admins', 'company-admins', 'admins', 'users', 'platforms', 'rebuttals', 'categories', 'deletedCompanies'];
    
    console.log('📊 Database Collections Overview:');
    console.log('================================');
    
    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`${collectionName}: ${snapshot.docs.length} documents`);
        
        if (snapshot.docs.length > 0) {
          const sampleDoc = snapshot.docs[0].data();
          console.log(`  Sample fields: ${Object.keys(sampleDoc).join(', ')}`);
        }
      } catch (error) {
        console.log(`${collectionName}: Error accessing collection - ${error.message}`);
      }
    }
    
    console.log('================================');
  } catch (error) {
    console.error('❌ Error listing collections:', error);
  }
};

/**
 * Fixes data inconsistencies (missing companyId fields, etc.)
 */
export const fixDataInconsistencies = async () => {
  try {
    const db = getDb();
    console.log('🔧 Fixing data inconsistencies...');

    // Check for users/admins without companyId
    const [adminsSnapshot, usersSnapshot] = await Promise.all([
      getDocs(collection(db, 'admins')),
      getDocs(collection(db, 'users'))
    ]);

    const adminsWithoutCompany = adminsSnapshot.docs.filter(doc => !doc.data().companyId);
    const usersWithoutCompany = usersSnapshot.docs.filter(doc => !doc.data().companyId);

    console.log(`Found ${adminsWithoutCompany.length} admins and ${usersWithoutCompany.length} users without companyId`);

    if (adminsWithoutCompany.length > 0 || usersWithoutCompany.length > 0) {
      // Get first company to assign orphaned users to
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      if (companiesSnapshot.docs.length > 0) {
        const firstCompanyId = companiesSnapshot.docs[0].id;
        console.log(`Assigning orphaned users to company: ${firstCompanyId}`);

        // Fix admins
        for (const adminDoc of adminsWithoutCompany) {
          await setDoc(doc(db, 'admins', adminDoc.id), {
            ...adminDoc.data(),
            companyId: firstCompanyId,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        // Fix users
        for (const userDoc of usersWithoutCompany) {
          await setDoc(doc(db, 'users', userDoc.id), {
            ...userDoc.data(),
            companyId: firstCompanyId,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        console.log('✅ Fixed orphaned users/admins');
      }
    }

    console.log('✅ Data inconsistency check completed');
  } catch (error) {
    console.error('❌ Error fixing data inconsistencies:', error);
  }
};

/**
 * Specifically checks and displays company-admin relationships
 */
export const verifyCompanyAdminRelationships = async () => {
  try {
    const db = getDb();
    console.log('🔍 Verifying company-admin relationships...');
    console.log('=====================================');

    // Get all companies
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    const companies = companiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all company admins
    const companyAdminsSnapshot = await getDocs(collection(db, 'company-admins'));
    const companyAdmins = companyAdminsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📊 Found ${companies.length} companies and ${companyAdmins.length} company admins`);
    console.log('');

    // Show relationships
    for (const company of companies) {
      console.log(`🏢 Company: ${company.name} (ID: ${company.id})`);
      
      // Find admins for this company
      const adminsForCompany = companyAdmins.filter(admin => 
        admin.companyId === company.id || 
        admin.company_id === company.id ||
        admin.company === company.id ||
        admin.companyID === company.id
      );

      if (adminsForCompany.length > 0) {
        console.log(`   ✅ Found ${adminsForCompany.length} company admin(s):`);
        adminsForCompany.forEach((admin, index) => {
          console.log(`      ${index + 1}. ${admin.name || 'No Name'} (${admin.email || 'No Email'})`);
          console.log(`         - Company ID Field: ${admin.companyId || admin.company_id || admin.company || admin.companyID || 'MISSING!'}`);
          console.log(`         - Role: ${admin.role || 'No Role'}`);
          console.log(`         - Status: ${admin.status || 'No Status'}`);
        });
      } else {
        console.log(`   ❌ No company admins found for this company`);
      }
      console.log('');
    }

    // Show orphaned company admins (not linked to any company)
    const orphanedAdmins = companyAdmins.filter(admin => {
      const adminCompanyId = admin.companyId || admin.company_id || admin.company || admin.companyID;
      return !adminCompanyId || !companies.some(company => company.id === adminCompanyId);
    });

    if (orphanedAdmins.length > 0) {
      console.log('⚠️ Orphaned company admins (not linked to any company):');
      orphanedAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name || 'No Name'} (${admin.email || 'No Email'})`);
        console.log(`      - Company ID: ${admin.companyId || admin.company_id || admin.company || admin.companyID || 'MISSING!'}`);
      });
    }

    console.log('=====================================');
    return { companies: companies.length, companyAdmins: companyAdmins.length, orphanedAdmins: orphanedAdmins.length };
  } catch (error) {
    console.error('❌ Error verifying company-admin relationships:', error);
    return null;
  }
};

/**
 * Debug specific company by name and fix its users/admins
 */
export const debugAndFixSpecificCompany = async (companyName = 'Long Home Products') => {
  try {
    const db = getDb();
    console.log(`🔍 Debugging company: ${companyName}`);
    console.log('=====================================');

    // Find the company
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    const targetCompany = companiesSnapshot.docs.find(doc => {
      const data = doc.data();
      return data.name === companyName || data.companyName === companyName;
    });

    if (!targetCompany) {
      console.log(`❌ Company "${companyName}" not found in database`);
      console.log('Available companies:');
      companiesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.name || data.companyName || 'No Name'} (ID: ${doc.id})`);
      });
      return null;
    }

    const companyData = targetCompany.data();
    const companyId = targetCompany.id;
    console.log(`✅ Found company: ${companyData.name} (ID: ${companyId})`);
    console.log('Company data:', companyData);

    // Check all possible admin/user collections
    const [
      superAdminsSnapshot,
      companyAdminsSnapshot,
      adminsSnapshot,
      usersSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'super-admins')),
      getDocs(collection(db, 'company-admins')),
      getDocs(collection(db, 'admins')),
      getDocs(collection(db, 'users'))
    ]);

    console.log('\n📊 Checking all collections for this company...');

    // Check super-admins
    const superAdmins = superAdminsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.companyId === companyId || data.company_id === companyId || 
             data.company === companyId || data.companyID === companyId;
    });
    console.log(`Super-admins: ${superAdmins.length}`);

    // Check company-admins
    const companyAdmins = companyAdminsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.companyId === companyId || data.company_id === companyId || 
             data.company === companyId || data.companyID === companyId;
    });
    console.log(`Company-admins: ${companyAdmins.length}`);
    if (companyAdmins.length > 0) {
      companyAdmins.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.data().name} - ${doc.data().email} (Field: ${doc.data().companyId || doc.data().company_id || doc.data().company || doc.data().companyID})`);
      });
    }

    // Check regular admins
    const admins = adminsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.companyId === companyId || data.company_id === companyId || 
             data.company === companyId || data.companyID === companyId;
    });
    console.log(`Regular admins: ${admins.length}`);
    if (admins.length > 0) {
      admins.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.data().name} - ${doc.data().email} (Field: ${doc.data().companyId || doc.data().company_id || doc.data().company || doc.data().companyID})`);
      });
    }

    // Check users
    const users = usersSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.companyId === companyId || data.company_id === companyId || 
             data.company === companyId || data.companyID === companyId;
    });
    console.log(`Regular users: ${users.length}`);
    if (users.length > 0) {
      users.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.data().name} - ${doc.data().email} (Field: ${doc.data().companyId || doc.data().company_id || doc.data().company || doc.data().companyID})`);
      });
    }

    const totalUsersAndAdmins = superAdmins.length + companyAdmins.length + admins.length + users.length;
    console.log(`\n📈 Total users/admins for ${companyName}: ${totalUsersAndAdmins}`);

    // If no users/admins found, create sample data
    if (totalUsersAndAdmins === 0) {
      console.log(`\n🛠 Creating sample users/admins for ${companyName}...`);
      
      // Create company admin
      const companyAdminData = {
        name: `${companyName} Admin`,
        email: `admin@longhomeproducts.com`,
        companyId: companyId,
        company_id: companyId, // backup field
        role: 'company-admin',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        permissions: ['read', 'write', 'delete'],
        isActive: true
      };
      
      await addDoc(collection(db, 'company-admins'), companyAdminData);
      console.log('✅ Created company admin:', companyAdminData);

      // Create regular users
      const userData1 = {
        name: `${companyName} User 1`,
        email: `user1@longhomeproducts.com`,
        companyId: companyId,
        company_id: companyId, // backup field
        role: 'user',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const userData2 = {
        name: `${companyName} Manager`,
        email: `manager@longhomeproducts.com`,
        companyId: companyId,
        company_id: companyId, // backup field
        role: 'manager',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      await addDoc(collection(db, 'users'), userData1);
      await addDoc(collection(db, 'users'), userData2);
      
      console.log('✅ Created users:', userData1, userData2);
      console.log(`\n🎉 Successfully created 1 admin and 2 users for ${companyName}`);
      
      return {
        companyId,
        companyName,
        created: {
          admins: 1,
          users: 2
        }
      };
    } else {
      console.log(`\n✅ Company ${companyName} already has users/admins`);
      return {
        companyId,
        companyName,
        existing: {
          superAdmins: superAdmins.length,
          companyAdmins: companyAdmins.length,
          admins: admins.length,
          users: users.length
        }
      };
    }

  } catch (error) {
    console.error(`❌ Error debugging company ${companyName}:`, error);
    return null;
  }
};

/**
 * Fix company ID mismatches - updates admin/user records to use correct company IDs
 */
export const fixCompanyIdMismatches = async () => {
  try {
    const db = getDb();
    console.log('🔧 Fixing company ID mismatches...');
    console.log('=====================================');

    // Get the actual company document
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    if (companiesSnapshot.docs.length === 0) {
      console.log('❌ No companies found in database');
      return null;
    }

    const company = companiesSnapshot.docs[0];
    const actualCompanyId = company.id;
    const companyData = company.data();
    const companyName = companyData.name || companyData.companyName || 'Unknown Company';

    console.log(`✅ Found company: ${companyName}`);
    console.log(`📋 Actual company ID: ${actualCompanyId}`);
    console.log(`📋 Company data:`, companyData);

    // Get all admin/user collections
    const [companyAdminsSnapshot, adminsSnapshot, usersSnapshot] = await Promise.all([
      getDocs(collection(db, 'company-admins')),
      getDocs(collection(db, 'admins')),
      getDocs(collection(db, 'users'))
    ]);

    console.log('\n🔍 Checking for ID mismatches...');

    // Check company-admins
    const companyAdminsToUpdate = [];
    companyAdminsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const currentCompanyId = data.companyId || data.company_id || data.company || data.companyID;
      
      console.log(`Company Admin: ${data.name || 'No Name'} - Current companyId: ${currentCompanyId}`);
      
      if (currentCompanyId !== actualCompanyId) {
        companyAdminsToUpdate.push({
          docId: doc.id,
          data: data,
          currentCompanyId: currentCompanyId
        });
      }
    });

    // Check regular admins
    const adminsToUpdate = [];
    adminsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const currentCompanyId = data.companyId || data.company_id || data.company || data.companyID;
      
      console.log(`Regular Admin: ${data.name || 'No Name'} - Current companyId: ${currentCompanyId}`);
      
      if (currentCompanyId && currentCompanyId !== actualCompanyId) {
        adminsToUpdate.push({
          docId: doc.id,
          data: data,
          currentCompanyId: currentCompanyId
        });
      }
    });

    // Check users (exclude super admin user)
    const usersToUpdate = [];
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const currentCompanyId = data.companyId || data.company_id || data.company || data.companyID;
      
      // Skip super admin user
      if (data.email === 'superadmin@longhome.com') {
        console.log(`Skipping super admin user: ${data.email}`);
        return;
      }
      
      console.log(`User: ${data.name || data.email || 'No Name'} - Current companyId: ${currentCompanyId}`);
      
      if (currentCompanyId && currentCompanyId !== actualCompanyId) {
        usersToUpdate.push({
          docId: doc.id,
          data: data,
          currentCompanyId: currentCompanyId
        });
      }
    });

    console.log(`\n📊 Found mismatches:`);
    console.log(`  - Company admins to update: ${companyAdminsToUpdate.length}`);
    console.log(`  - Regular admins to update: ${adminsToUpdate.length}`);
    console.log(`  - Users to update: ${usersToUpdate.length}`);

    // Update company-admins
    if (companyAdminsToUpdate.length > 0) {
      console.log('\n🔧 Updating company-admins...');
      for (const admin of companyAdminsToUpdate) {
        await updateDoc(doc(db, 'company-admins', admin.docId), {
          companyId: actualCompanyId,
          company_id: actualCompanyId, // backup field
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Updated company admin: ${admin.data.name} (${admin.currentCompanyId} → ${actualCompanyId})`);
      }
    }

    // Update regular admins
    if (adminsToUpdate.length > 0) {
      console.log('\n🔧 Updating regular admins...');
      for (const admin of adminsToUpdate) {
        await updateDoc(doc(db, 'admins', admin.docId), {
          companyId: actualCompanyId,
          company_id: actualCompanyId, // backup field
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Updated regular admin: ${admin.data.name} (${admin.currentCompanyId} → ${actualCompanyId})`);
      }
    }

    // Update users
    if (usersToUpdate.length > 0) {
      console.log('\n🔧 Updating users...');
      for (const user of usersToUpdate) {
        await updateDoc(doc(db, 'users', user.docId), {
          companyId: actualCompanyId,
          company_id: actualCompanyId, // backup field
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Updated user: ${user.data.name || user.data.email} (${user.currentCompanyId} → ${actualCompanyId})`);
      }
    }

    const totalUpdated = companyAdminsToUpdate.length + adminsToUpdate.length + usersToUpdate.length;
    
    if (totalUpdated > 0) {
      console.log(`\n🎉 Successfully updated ${totalUpdated} records with correct company ID: ${actualCompanyId}`);
    } else {
      console.log('\n✅ No ID mismatches found - all records already have correct company IDs');
    }

    console.log('=====================================');
    
    return {
      companyId: actualCompanyId,
      companyName: companyName,
      updated: {
        companyAdmins: companyAdminsToUpdate.length,
        admins: adminsToUpdate.length,
        users: usersToUpdate.length,
        total: totalUpdated
      }
    };

  } catch (error) {
    console.error('❌ Error fixing company ID mismatches:', error);
    return null;
  }
};