import { 
  getTimeBlocks, getAvailability, setAvailability,
  getRegions
} from '../services/firebase/scheduling';

export const fixAvailabilityData = async () => {
  try {
    console.log('🔧 Fixing availability data to match current time blocks...');
    
    // Get current time blocks and regions
    const timeBlocks = await getTimeBlocks();
    const regions = await getRegions();
    
    console.log('📅 Current time blocks:', timeBlocks);
    console.log('🏢 Current regions:', regions);
    
    // Create a mapping of old time block names to new IDs
    const timeBlockMapping = {
      'morning': 'weekend-morning',
      'late-morning': 'weekend-morning', 
      'early-afternoon': 'weekend-afternoon',
      'late-afternoon': 'weekend-afternoon',
      'evening': 'weekday-evening'
    };
    
    // Get all availability documents for the next 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const dayType = isWeekend ? 'weekend' : 'weekday';
      
      // Get current availability for this date
      const currentAvailability = await getAvailability(dateStr);
      
      if (currentAvailability && currentAvailability.slots) {
        console.log(`🔄 Fixing availability for ${dateStr} (${dayType})`);
        
        // Create new availability structure
        const newAvailability = {
          date: dateStr,
          dayType,
          slots: {}
        };
        
        // Get time blocks for this day type
        const blocksForDay = timeBlocks.filter(block => block.dayType === dayType);
        
        // Create new slots using current time block IDs
        for (const block of blocksForDay) {
          newAvailability.slots[block.id] = {};
          
          // Add availability for each region
          for (const region of regions) {
            // Check if there's existing data for this region
            let existingData = null;
            
            // Look for existing data in old format
            Object.keys(currentAvailability.slots).forEach(oldTimeKey => {
              const mappedTimeKey = timeBlockMapping[oldTimeKey];
              if (mappedTimeKey === block.id && currentAvailability.slots[oldTimeKey]?.[region.id]) {
                existingData = currentAvailability.slots[oldTimeKey][region.id];
              }
            });
            
            // Use existing data or default values
            newAvailability.slots[block.id][region.id] = existingData || {
              available: true,
              booked: 0,
              capacity: 3
            };
          }
        }
        
        // Update the availability document
        await setAvailability(dateStr, newAvailability);
        console.log(`✅ Fixed availability for ${dateStr}`);
      }
    }
    
    console.log('🎉 Availability data fix completed!');
  } catch (error) {
    console.error('❌ Error fixing availability data:', error);
  }
}; 