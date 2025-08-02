const admin = require('firebase-admin');
const serviceAccount = require('../long-home-c034d-firebase-adminsdk-fbsvc-791f28392a.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://long-home-c034d.firebaseio.com"
});

const db = admin.firestore();

// Business regions
const REGIONS = ['MIDA', 'ESDE', 'NOVA', 'NENG', 'NHME', 'CTWM', 'SOPA', 'WCFL'];

// Time blocks with their default capacities
const TIME_BLOCKS = [
  { id: 'morning', time: '9:00 AM', label: 'Morning', defaultCapacity: 3 },
  { id: 'late-morning', time: '11:00 AM', label: 'Late Morning', defaultCapacity: 3 },
  { id: 'early-afternoon', time: '2:00 PM', label: 'Early Afternoon', defaultCapacity: 3 },
  { id: 'late-afternoon', time: '4:00 PM', label: 'Late Afternoon', defaultCapacity: 3 },
  { id: 'evening', time: '6:00 PM', label: 'Evening', defaultCapacity: 3 }
];

// Generate dates for the next 3 weeks
const generateDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 21; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

// Generate availability data for a region
const generateRegionAvailability = (region) => {
  const availability = {};
  
  TIME_BLOCKS.forEach(block => {
    // Randomize availability slightly for realism
    const baseCapacity = block.defaultCapacity;
    const available = Math.floor(Math.random() * (baseCapacity + 1)) + 1; // 1 to capacity
    
    availability[block.id] = {
      available,
      capacity: baseCapacity,
      time: block.time,
      label: block.label
    };
  });
  
  return availability;
};

// Initialize availability data
const initializeAvailability = async () => {
  console.log('🚀 Initializing region-based availability data...');
  
  const dates = generateDates();
  const batch = db.batch();
  
  for (const date of dates) {
    const availabilityDoc = {
      date,
      regions: {}
    };
    
    // Generate availability for each region
    REGIONS.forEach(region => {
      availabilityDoc.regions[region] = generateRegionAvailability(region);
    });
    
    const docRef = db.collection('availability').doc(date);
    batch.set(docRef, availabilityDoc);
  }
  
  try {
    await batch.commit();
    console.log(`✅ Successfully initialized availability for ${dates.length} dates across ${REGIONS.length} regions`);
    
    // Log sample data
    console.log('\n📊 Sample availability data:');
    const sampleDate = dates[0];
    const sampleDoc = await db.collection('availability').doc(sampleDate).get();
    if (sampleDoc.exists) {
      const data = sampleDoc.data();
      console.log(`Date: ${sampleDate}`);
      console.log('Regions:', Object.keys(data.regions));
      console.log('Sample region (MIDA):', data.regions.MIDA);
    }
    
  } catch (error) {
    console.error('❌ Error initializing availability:', error);
  }
};

// Initialize time blocks
const initializeTimeBlocks = async () => {
  console.log('⏰ Initializing time blocks...');
  
  const batch = db.batch();
  
  TIME_BLOCKS.forEach(block => {
    const docRef = db.collection('timeBlocks').doc(block.id);
    batch.set(docRef, {
      id: block.id,
      time: block.time,
      label: block.label,
      defaultCapacity: block.defaultCapacity,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  try {
    await batch.commit();
    console.log(`✅ Successfully initialized ${TIME_BLOCKS.length} time blocks`);
  } catch (error) {
    console.error('❌ Error initializing time blocks:', error);
  }
};

// Initialize regions
const initializeRegions = async () => {
  console.log('🌍 Initializing regions...');
  
  const batch = db.batch();
  
  REGIONS.forEach(region => {
    const docRef = db.collection('regions').doc(region);
    batch.set(docRef, {
      id: region,
      name: region,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  try {
    await batch.commit();
    console.log(`✅ Successfully initialized ${REGIONS.length} regions`);
  } catch (error) {
    console.error('❌ Error initializing regions:', error);
  }
};

// Main initialization function
const initializeAll = async () => {
  console.log('🎯 Starting Firestore initialization...\n');
  
  try {
    await initializeTimeBlocks();
    await initializeRegions();
    await initializeAvailability();
    
    console.log('\n🎉 All initialization complete!');
    console.log('\n📋 Summary:');
    console.log(`- ${TIME_BLOCKS.length} time blocks`);
    console.log(`- ${REGIONS.length} regions`);
    console.log(`- 21 days of availability data`);
    console.log(`- Region-based slot management`);
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  } finally {
    process.exit(0);
  }
};

// Run initialization
initializeAll(); 