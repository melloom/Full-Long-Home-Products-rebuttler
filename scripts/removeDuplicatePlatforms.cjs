const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'long-home-c034d'
});

const db = admin.firestore();

async function removeDuplicatePlatforms() {
  try {
    console.log('🔍 Checking for duplicate platforms...\n');

    // Get all platforms
    const platformsSnapshot = await db.collection('platforms').get();
    const platforms = platformsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`📊 Found ${platforms.length} platforms:`);
    platforms.forEach(platform => {
      console.log(`   - ${platform.name} (${platform.id}) - Company: ${platform.companyId} - Domain: ${platform.domain}`);
    });

    // Find duplicates by name and domain
    const duplicates = [];
    const seen = new Set();

    for (const platform of platforms) {
      const key = `${platform.name}-${platform.domain}-${platform.companyId}`;
      if (seen.has(key)) {
        duplicates.push(platform);
      } else {
        seen.add(key);
      }
    }

    console.log(`\n🔄 Found ${duplicates.length} duplicate(s):`);
    duplicates.forEach(duplicate => {
      console.log(`   - ${duplicate.name} (${duplicate.id}) - Domain: ${duplicate.domain}`);
    });

    // Remove duplicates (keep the first one, delete the rest)
    for (const duplicate of duplicates) {
      await db.collection('platforms').doc(duplicate.id).delete();
      console.log(`🗑️ Deleted duplicate platform: ${duplicate.name} (${duplicate.id})`);
    }

    // Final summary
    const remainingPlatforms = await db.collection('platforms').get();
    console.log(`\n📊 Remaining platforms: ${remainingPlatforms.size}`);
    remainingPlatforms.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${doc.id}) - Company: ${data.companyId} - Domain: ${data.domain}`);
    });

    console.log('\n🎉 Duplicate platform removal completed!');

  } catch (error) {
    console.error('❌ Error removing duplicate platforms:', error);
  } finally {
    process.exit();
  }
}

removeDuplicatePlatforms();