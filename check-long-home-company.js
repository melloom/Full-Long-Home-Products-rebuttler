const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./src/services/firebase/nodeConfig.js');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

async function checkLongHomeCompany() {
  try {
    console.log('🔍 Checking Long Home company in database...\n');
    
    // Check by slug
    const slugQuery = await db.collection('companies').where('slug', '==', 'long-home').get();
    if (!slugQuery.empty) {
      console.log('✅ Found by slug "long-home":');
      slugQuery.forEach(doc => {
        console.log(`  ID: ${doc.id}`);
        console.log(`  Data:`, doc.data());
      });
    } else {
      console.log('❌ No company found with slug "long-home"');
    }
    
    // Check by name
    const nameQuery = await db.collection('companies').where('name', '==', 'Long Home Products').get();
    if (!nameQuery.empty) {
      console.log('\n✅ Found by name "Long Home Products":');
      nameQuery.forEach(doc => {
        console.log(`  ID: ${doc.id}`);
        console.log(`  Data:`, doc.data());
      });
    } else {
      console.log('\n❌ No company found with name "Long Home Products"');
    }
    
    // Check company-001
    const company001 = await db.collection('companies').doc('company-001').get();
    if (company001.exists) {
      console.log('\n✅ Found company-001:');
      console.log(`  Data:`, company001.data());
    } else {
      console.log('\n❌ No company found with ID "company-001"');
    }
    
    // List all companies
    console.log('\n📋 All companies in database:');
    const allCompanies = await db.collection('companies').get();
    allCompanies.forEach(doc => {
      const data = doc.data();
      console.log(`  ID: ${doc.id} | Name: ${data.name || 'N/A'} | Slug: ${data.slug || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

checkLongHomeCompany();