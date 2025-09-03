const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

// Function to create a URL-friendly slug from company name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

async function addCompanySlugs() {
  try {
    console.log('🚀 Adding slugs to companies...');

    // Get all companies
    const companiesSnapshot = await db.collection('companies').get();
    
    if (companiesSnapshot.empty) {
      console.log('No companies found.');
      return;
    }

    const batch = db.batch();
    let updateCount = 0;

    companiesSnapshot.forEach((doc) => {
      const companyData = doc.data();
      const companyName = companyData.name;
      
      if (companyName && !companyData.slug) {
        const slug = createSlug(companyName);
        
        // Update the company document with the slug
        batch.update(doc.ref, {
          slug: slug,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        updateCount++;
        console.log(`✅ Added slug "${slug}" to company "${companyName}"`);
      } else if (companyData.slug) {
        console.log(`⏭️  Company "${companyName}" already has slug "${companyData.slug}"`);
      } else {
        console.log(`⚠️  Company "${companyName}" has no name, skipping...`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n🎉 Successfully added slugs to ${updateCount} companies!`);
    } else {
      console.log('\n✅ All companies already have slugs.');
    }

    // Create a sample company with slug for testing
    const sampleCompanyData = {
      name: 'Long Home Products',
      slug: 'long-home-products',
      email: 'info@longhome.com',
      industry: 'Home Improvement',
      plan: 'professional',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const sampleCompanyRef = db.collection('companies').doc('long-home-products');
    await sampleCompanyRef.set(sampleCompanyData, { merge: true });
    
    console.log('✅ Created/updated sample company: Long Home Products');
    console.log('🌐 Company URL: /company/long-home-products');

  } catch (error) {
    console.error('❌ Error adding company slugs:', error);
  } finally {
    process.exit();
  }
}

addCompanySlugs();