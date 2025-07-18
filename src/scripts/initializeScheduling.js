import { 
  addTimeBlock, addRegion, setAvailability,
  getTimeBlocks, getRegions 
} from '../services/firebase/scheduling';

// Default time blocks
const defaultTimeBlocks = [
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
const defaultRegions = [
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

export const initializeSchedulingData = async () => {
  try {
    console.log('Initializing scheduling data...');
    
    // Check if data already exists
    const existingBlocks = await getTimeBlocks();
    const existingRegions = await getRegions();
    
    if (existingBlocks.length === 0) {
      console.log('Adding default time blocks...');
      for (const block of defaultTimeBlocks) {
        await addTimeBlock(block);
      }
    }
    
    if (existingRegions.length === 0) {
      console.log('Adding default regions...');
      for (const region of defaultRegions) {
        await addRegion(region);
      }
    }
    
    // Initialize availability for next 3 weeks
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
      
      // Add slots for each time block using the correct IDs
      const blocksForDay = defaultTimeBlocks.filter(block => block.dayType === dayType);
      for (const block of blocksForDay) {
        availability.slots[block.id] = {};
        
        // Add availability for each region
        for (const region of defaultRegions) {
          availability.slots[block.id][region.id] = {
            available: true,
            booked: 0,
            capacity: 3
          };
        }
      }
      
      await setAvailability(dateStr, availability);
    }
    
    console.log('Scheduling data initialized successfully!');
  } catch (error) {
    console.error('Error initializing scheduling data:', error);
  }
}; 