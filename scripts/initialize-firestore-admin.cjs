const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../long-home-c034d-firebase-adminsdk-fbsvc-791f28392a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Default time blocks
const timeBlocks = [
  {
    id: 'weekday-morning',
    time: '10:00 AM',
    label: 'Morning',
    available: true,
    dayType: 'weekday'
  },
  {
    id: 'weekday-afternoon',
    time: '2:00 PM',
    label: 'Afternoon',
    available: true,
    dayType: 'weekday'
  },
  {
    id: 'weekday-evening',
    time: '6:00 PM',
    label: 'Evening',
    available: true,
    dayType: 'weekday'
  },
  {
    id: 'weekend-morning',
    time: '10:00 AM',
    label: 'Morning',
    available: true,
    dayType: 'weekend'
  },
  {
    id: 'weekend-afternoon',
    time: '2:00 PM',
    label: 'Afternoon',
    available: true,
    dayType: 'weekend'
  }
];

// Default regions
const regions = [
  {
    id: 'mida',
    name: 'MIDA',
    reps: ['John Smith', 'Sarah Johnson'],
    color: '#3b82f6'
  },
  {
    id: 'esde',
    name: 'ESDE',
    reps: ['Mike Davis', 'Lisa Wilson'],
    color: '#10b981'
  },
  {
    id: 'nova',
    name: 'NOVA',
    reps: ['David Brown', 'Emma Taylor'],
    color: '#f59e0b'
  },
  {
    id: 'neng',
    name: 'NENG',
    reps: ['Alex Rodriguez', 'Maria Garcia'],
    color: '#ef4444'
  },
  {
    id: 'nhme',
    name: 'NHME',
    reps: ['Jennifer Lee', 'Robert Wilson'],
    color: '#8b5cf6'
  },
  {
    id: 'ctwm',
    name: 'CTWM',
    reps: ['Michael Chen', 'Amanda Johnson'],
    color: '#06b6d4'
  },
  {
    id: 'sopa',
    name: 'SOPA',
    reps: ['Christopher Davis', 'Rachel Green'],
    color: '#f97316'
  },
  {
    id: 'wcfl',
    name: 'WCFL',
    reps: ['Daniel Martinez', 'Jessica Taylor'],
    color: '#ec4899'
  }
];

// Initialize time blocks
async function initializeTimeBlocks() {
  console.log('🚀 Initializing time blocks...');
  
  try {
    for (const block of timeBlocks) {
      await db.collection('timeBlocks').doc(block.id).set(block);
      console.log(`✅ Added time block: ${block.time} (${block.dayType})`);
    }
    console.log('✅ All time blocks initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing time blocks:', error);
  }
}

// Initialize regions
async function initializeRegions() {
  console.log('🚀 Initializing regions...');
  
  try {
    for (const region of regions) {
      await db.collection('regions').doc(region.id).set(region);
      console.log(`✅ Added region: ${region.name}`);
    }
    console.log('✅ All regions initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing regions:', error);
  }
}

// Initialize availability for next 3 weeks
async function initializeAvailability() {
  console.log('🚀 Initializing availability for next 3 weeks...');
  
  try {
    const today = new Date();
    
    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const dayType = isWeekend ? 'weekend' : 'weekday';
      
      const availability = {
        date: dateStr,
        dayType,
        slots: {}
      };
      
      // Add slots for each time block
      const blocksForDay = timeBlocks.filter(block => block.dayType === dayType);
      for (const block of blocksForDay) {
        availability.slots[block.id] = {};
        
        // Add availability for each region
        for (const region of regions) {
          availability.slots[block.id][region.id] = {
            available: true,
            booked: 0,
            capacity: 3
          };
        }
      }
      
      await db.collection('availability').doc(dateStr).set(availability);
      console.log(`✅ Added availability for: ${dateStr} (${dayType})`);
    }
    
    console.log('✅ All availability initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing availability:', error);
  }
}

// Main initialization function
async function initializeFirestore() {
  console.log('🔥 Starting Firestore initialization with Admin SDK...');
  console.log('📁 Using service account:', serviceAccount.project_id);
  
  try {
    await initializeTimeBlocks();
    await initializeRegions();
    await initializeAvailability();
    
    console.log('🎉 Firestore initialization complete!');
    console.log('📊 Summary:');
    console.log(`   • ${timeBlocks.length} time blocks created`);
    console.log(`   • ${regions.length} regions created`);
    console.log(`   • 21 days of availability created`);
    
  } catch (error) {
    console.error('❌ Firestore initialization failed:', error);
  } finally {
    // Close the connection
    process.exit(0);
  }
}

// Run the initialization
initializeFirestore(); 