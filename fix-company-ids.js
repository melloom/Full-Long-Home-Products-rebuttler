#!/usr/bin/env node

// Quick fix script to update company IDs in the database
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration (you may need to update this with your actual config)
const firebaseConfig = {
  // Add your Firebase config here if needed
  // For now, we'll assume it's configured elsewhere
};

async function fixCompanyIds() {
  try {
    console.log('🔧 Starting company ID fix...');
    
    // Initialize Firebase (assuming it's already configured in your app)
    const db = getFirestore();
    
    // Get the actual company document
    console.log('📋 Getting company document...');
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    
    if (companiesSnapshot.docs.length === 0) {
      console.log('❌ No companies found');
      return;
    }
    
    const company = companiesSnapshot.docs[0];
    const actualCompanyId = company.id;
    const companyData = company.data();
    const companyName = companyData.name || companyData.companyName || 'Unknown';
    
    console.log(`✅ Found company: ${companyName}`);
    console.log(`📋 Actual company ID: ${actualCompanyId}`);
    
    // Get all admin/user collections
    const [companyAdminsSnapshot, adminsSnapshot, usersSnapshot] = await Promise.all([
      getDocs(collection(db, 'company-admins')),
      getDocs(collection(db, 'admins')),
      getDocs(collection(db, 'users'))
    ]);
    
    console.log('\n🔍 Checking for ID mismatches...');
    
    let totalUpdated = 0;
    
    // Fix company-admins
    for (const docSnapshot of companyAdminsSnapshot.docs) {
      const data = docSnapshot.data();
      const currentCompanyId = data.companyId || data.company_id || data.company || data.companyID;
      
      if (currentCompanyId !== actualCompanyId) {
        console.log(`🔧 Updating company admin: ${data.name} (${currentCompanyId} → ${actualCompanyId})`);
        await updateDoc(doc(db, 'company-admins', docSnapshot.id), {
          companyId: actualCompanyId,
          company_id: actualCompanyId,
          updatedAt: serverTimestamp()
        });
        totalUpdated++;
      } else {
        console.log(`✅ Company admin ${data.name} already has correct ID`);
      }
    }
    
    // Fix regular admins
    for (const docSnapshot of adminsSnapshot.docs) {
      const data = docSnapshot.data();
      const currentCompanyId = data.companyId || data.company_id || data.company || data.companyID;
      
      if (currentCompanyId && currentCompanyId !== actualCompanyId) {
        console.log(`🔧 Updating admin: ${data.name} (${currentCompanyId} → ${actualCompanyId})`);
        await updateDoc(doc(db, 'admins', docSnapshot.id), {
          companyId: actualCompanyId,
          company_id: actualCompanyId,
          updatedAt: serverTimestamp()
        });
        totalUpdated++;
      } else if (currentCompanyId === actualCompanyId) {
        console.log(`✅ Admin ${data.name} already has correct ID`);
      }
    }
    
    // Fix users (skip super admin)
    for (const docSnapshot of usersSnapshot.docs) {
      const data = docSnapshot.data();
      const currentCompanyId = data.companyId || data.company_id || data.company || data.companyID;
      
      // Skip super admin user
      if (data.email === 'superadmin@longhome.com') {
        console.log(`⏭️  Skipping super admin user`);
        continue;
      }
      
      if (currentCompanyId && currentCompanyId !== actualCompanyId) {
        console.log(`🔧 Updating user: ${data.name || data.email} (${currentCompanyId} → ${actualCompanyId})`);
        await updateDoc(doc(db, 'users', docSnapshot.id), {
          companyId: actualCompanyId,
          company_id: actualCompanyId,
          updatedAt: serverTimestamp()
        });
        totalUpdated++;
      } else if (currentCompanyId === actualCompanyId) {
        console.log(`✅ User ${data.name || data.email} already has correct ID`);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${totalUpdated} records!`);
    console.log(`✅ All users/admins now have company ID: ${actualCompanyId}`);
    console.log('\n🔄 Please refresh your browser to see the updated data.');
    
  } catch (error) {
    console.error('❌ Error fixing company IDs:', error);
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixCompanyIds();
}

module.exports = { fixCompanyIds };