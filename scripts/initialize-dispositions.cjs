const admin = require('firebase-admin');
const serviceAccount = require('../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Default dispositions data
const dispositions = [
  {
    id: 1,
    name: 'Set Lead',
    category: 'scheduled',
    description: 'Lead has been set and scheduled for an appointment. This is a confirmed appointment where the customer has agreed to meet with a sales representative.',
    icon: '✅',
    color: 'green',
    nextSteps: 'Confirm appointment details and prepare for visit',
    tips: [
      'Verify appointment time and date',
      'Confirm customer contact information',
      'Prepare necessary materials',
      'Review customer history',
      'Check for any special requirements'
    ],
    examples: [
      'Customer agreed to meet on Tuesday at 2 PM',
      'Appointment confirmed for Saturday morning',
      'Customer scheduled for evening consultation'
    ],
    subcategories: [
      'New Appointment',
      'Rescheduled Appointment',
      'Follow-up Appointment'
    ],
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 2,
    name: 'Busy',
    category: 'scheduled',
    description: 'Customer is currently too busy to meet but has expressed interest in scheduling for a later time. This indicates potential interest but requires follow-up.',
    icon: '⏰',
    color: 'yellow',
    nextSteps: 'Schedule follow-up call in 1-2 weeks',
    tips: [
      'Ask for specific timeframe when they might be available',
      'Note their preferred contact times',
      'Document their current busy period',
      'Suggest alternative meeting times',
      'Offer flexible scheduling options'
    ],
    examples: [
      'Customer in middle of home renovation',
      'Customer traveling for next two weeks',
      'Customer has family visiting'
    ],
    subcategories: [
      'Temporarily Busy',
      'Seasonal Busy',
      'Work Schedule Conflict'
    ],
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 3,
    name: 'Call Back',
    category: 'scheduled',
    description: 'Customer requested to be called back at a specific time. This is a positive sign of interest and should be followed up promptly.',
    icon: '📞',
    color: 'blue',
    nextSteps: 'Call back at the requested time',
    tips: [
      'Set a reminder for the callback time',
      'Prepare for the callback conversation',
      'Have relevant information ready',
      'Be punctual with the callback',
      'Follow up on any previous discussions'
    ],
    examples: [
      'Customer asked to call back after 3 PM',
      'Customer wants to discuss with spouse first',
      'Customer needs to check their schedule'
    ],
    subcategories: [
      'Specific Time Requested',
      'Need to Consult Others',
      'Schedule Check Required'
    ],
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 4,
    name: 'Not Interested',
    category: 'closed',
    description: 'Customer has explicitly stated they are not interested in the service or product. This is a definitive no.',
    icon: '❌',
    color: 'red',
    nextSteps: 'Respect their decision and end the conversation politely',
    tips: [
      'Thank them for their time',
      'Leave the door open for future contact',
      'Ask if they know anyone who might be interested',
      'Be professional and courteous',
      'Document the interaction properly'
    ],
    examples: [
      'Customer said they are not interested',
      'Customer declined the offer',
      'Customer said no thank you'
    ],
    subcategories: [
      'Definitive No',
      'Not Right Now',
      'Not a Good Fit'
    ],
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 5,
    name: 'Do Not Call',
    category: 'closed',
    description: 'Customer has requested to be placed on a do not call list. This is a permanent no and should be respected.',
    icon: '🚫',
    color: 'red',
    nextSteps: 'Add to do not call list and remove from future campaigns',
    tips: [
      'Immediately stop all contact attempts',
      'Add to do not call database',
      'Respect their privacy',
      'Do not attempt to contact again',
      'Update all relevant systems'
    ],
    examples: [
      'Customer asked to be removed from call list',
      'Customer said do not call again',
      'Customer requested to be taken off the list'
    ],
    subcategories: [
      'Permanent No',
      'Privacy Request',
      'Remove from List'
    ],
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

// Initialize dispositions
async function initializeDispositions() {
  console.log('🚀 Initializing dispositions...');
  
  try {
    // Check if dispositions already exist
    const existingDispositions = await db.collection('dispositions').get();
    
    if (!existingDispositions.empty) {
      console.log(`⚠️ Found ${existingDispositions.size} existing dispositions. Skipping initialization.`);
      return;
    }
    
    // Add all dispositions
    for (const disposition of dispositions) {
      await db.collection('dispositions').add(disposition);
      console.log(`✅ Added disposition: ${disposition.name}`);
    }
    
    console.log('✅ All dispositions initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing dispositions:', error);
  }
}

// Main execution
async function main() {
  try {
    await initializeDispositions();
    console.log('\n🎉 Dispositions initialization completed!');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  } finally {
    process.exit();
  }
}

main();