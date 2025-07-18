import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, MapPin, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { 
  getTimeBlocks, listenTimeBlocks, setTimeBlock, addTimeBlock, deleteTimeBlock,
  getRegions, listenRegions, setRegion, addRegion, deleteRegion,
  getAvailability, listenAvailability, setAvailability
} from '../../services/firebase/scheduling';
import { initializeSchedulingData } from '../../scripts/initializeScheduling';
import './TimeBlockManagement.css';

const TimeBlockManagement = () => {
  const [timeBlocks, setTimeBlocks] = useState({
    weekdays: [],
    weekends: []
  });

  const [regions, setRegions] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editingRegion, setEditingRegion] = useState(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [syncingAvailability, setSyncingAvailability] = useState(false);

  // Generate next 3 weeks of dates
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  // Load data from Firestore on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Initialize data if needed
        await initializeSchedulingData();
        
        // Load time blocks
        const blocks = await getTimeBlocks();
        const weekdays = blocks.filter(block => block.dayType === 'weekday');
        const weekends = blocks.filter(block => block.dayType === 'weekend');
        
        setTimeBlocks({ weekdays, weekends });
        
        // Load regions
        const regionsData = await getRegions();
        setRegions(regionsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const unsubscribeBlocks = listenTimeBlocks((blocks) => {
      const weekdays = blocks.filter(block => block.dayType === 'weekday');
      const weekends = blocks.filter(block => block.dayType === 'weekend');
      setTimeBlocks({ weekdays, weekends });
    });

    const unsubscribeRegions = listenRegions((regionsData) => {
      setRegions(regionsData);
    });

    // Load availability data for all dates
    const loadAvailability = async () => {
      const availabilityData = {};
      for (const date of dates) {
        const dateStr = date.toISOString().split('T')[0];
        const dateAvailability = await getAvailability(dateStr);
        if (dateAvailability) {
          availabilityData[dateStr] = dateAvailability;
        }
      }
      setAvailability(availabilityData);
    };

    loadAvailability();

    return () => {
      unsubscribeBlocks();
      unsubscribeRegions();
    };
  }, []);

  const handleTimeBlockChange = async (dayType, blockId, field, value) => {
    try {
      const updatedBlock = timeBlocks[dayType].find(block => block.id === blockId);
      if (updatedBlock) {
        await setTimeBlock(blockId, { ...updatedBlock, [field]: value });
      }
    } catch (error) {
      console.error('Error updating time block:', error);
    }
  };

  const handleAddTimeBlock = async (dayType) => {
    try {
      const newBlock = {
        id: Date.now().toString(),
        time: '',
        label: '',
        available: true,
        dayType: dayType
      };
      
      await addTimeBlock(newBlock);
      setEditingBlock(newBlock.id);
    } catch (error) {
      console.error('Error adding time block:', error);
    }
  };

  const handleDeleteTimeBlock = async (dayType, blockId) => {
    try {
      await deleteTimeBlock(blockId);
    } catch (error) {
      console.error('Error deleting time block:', error);
    }
  };

  const handleRegionChange = async (regionId, field, value) => {
    try {
      const updatedRegion = regions.find(region => region.id === regionId);
      if (updatedRegion) {
        await setRegion(regionId, { ...updatedRegion, [field]: value });
      }
    } catch (error) {
      console.error('Error updating region:', error);
    }
  };

  const handleAddRegion = async () => {
    try {
      const newRegion = {
        id: Date.now().toString(),
        name: 'New Region',
        reps: [],
        color: '#3b82f6'
      };
      
      await addRegion(newRegion);
      setEditingRegion(newRegion.id);
    } catch (error) {
      console.error('Error adding region:', error);
    }
  };

  const handleDeleteRegion = async (regionId) => {
    try {
      await deleteRegion(regionId);
    } catch (error) {
      console.error('Error deleting region:', error);
    }
  };

  const handleAvailabilityChange = async (date, timeBlock, regionId, available) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const currentAvailability = await getAvailability(dateStr) || {};
      
      const updatedAvailability = {
        ...currentAvailability,
        slots: {
          ...currentAvailability.slots,
          [timeBlock]: {
            ...currentAvailability.slots?.[timeBlock],
            [regionId]: {
              available,
              booked: currentAvailability.slots?.[timeBlock]?.[regionId]?.booked || 0,
              capacity: currentAvailability.slots?.[timeBlock]?.[regionId]?.capacity || 3
            }
          }
        }
      };
      
      await setAvailability(dateStr, updatedAvailability);
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleSyncAvailability = async () => {
    try {
      setSyncingAvailability(true);
      console.log('🔄 Syncing availability with current time blocks...');
      
      // Get all availability data
      const allAvailability = await getAvailability();
      
      // For each date in availability, update the slots
      for (const [dateStr, dateAvailability] of Object.entries(allAvailability)) {
        if (!dateAvailability || !dateAvailability.slots) continue;
        
        const date = new Date(dateStr);
        const isWeekendDate = isWeekend(date);
        const validTimeBlocks = isWeekendDate ? timeBlocks.weekends : timeBlocks.weekdays;
        
        // Create updated slots object
        const updatedSlots = {};
        
        // Add slots for valid time blocks
        for (const timeBlock of validTimeBlocks) {
          const existingSlot = dateAvailability.slots[timeBlock.id];
          updatedSlots[timeBlock.id] = existingSlot || {
            available: true,
            booked: 0,
            capacity: 3
          };
        }
        
        // Update the availability for this date
        const updatedAvailability = {
          ...dateAvailability,
          slots: updatedSlots
        };
        
        await setAvailability(dateStr, updatedAvailability);
        console.log('✅ Updated availability for date:', dateStr, updatedSlots);
      }
      
      console.log('✅ Availability sync completed!');
    } catch (error) {
      console.error('❌ Error syncing availability:', error);
    } finally {
      setSyncingAvailability(false);
    }
  };

  const isWeekend = (date) => {
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const getTimeBlocksForDate = (date) => {
    return isWeekend(date) ? timeBlocks.weekends : timeBlocks.weekdays;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="time-block-management">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          height: '50vh',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading Time Block Management...</div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="time-block-management">
      <motion.div 
        className="tbm-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>⏰ Time Block Management</h1>
        <p>Configure appointment time blocks, regional assignments, and availability</p>
        
        {/* Sync Availability Button */}
        <motion.button
          onClick={handleSyncAvailability}
          disabled={syncingAvailability}
          className="sync-availability-btn"
          style={{
            background: syncingAvailability ? '#6b7280' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontWeight: 600,
            cursor: syncingAvailability ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          whileHover={syncingAvailability ? {} : { scale: 1.05 }}
          whileTap={syncingAvailability ? {} : { scale: 0.95 }}
        >
          {syncingAvailability ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Syncing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 2V9H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 22V15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 16C21 16.5304 20.7893 17.0391 20.4142 17.4142C20.0391 17.7893 19.5304 18 19 18H15L18 21L21 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H9L6 3L3 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sync Availability with Time Blocks
            </>
          )}
        </motion.button>
      </motion.div>

      <div className="tbm-content">
        {/* Time Blocks Configuration */}
        <motion.div 
          className="tbm-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="section-header">
            <Clock className="section-icon" />
            <h2>Time Blocks Configuration</h2>
          </div>

          <div className="time-blocks-grid">
            {/* Weekday Blocks */}
            <div className="day-type-section">
              <h3>Weekday Blocks</h3>
              <div className="blocks-list">
                {timeBlocks.weekdays.map(block => (
                  <div key={block.id} className="time-block-item">
                    {editingBlock === block.id ? (
                      <div className="edit-block-form">
                        <input
                          type="time"
                          value={block.time}
                          onChange={(e) => handleTimeBlockChange('weekdays', block.id, 'time', e.target.value)}
                          className="time-input"
                        />
                        <input
                          type="text"
                          placeholder="Label (e.g., Morning)"
                          value={block.label}
                          onChange={(e) => handleTimeBlockChange('weekdays', block.id, 'label', e.target.value)}
                          className="label-input"
                        />
                        <div className="edit-actions">
                          <button 
                            onClick={() => setEditingBlock(null)}
                            className="save-btn"
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTimeBlock('weekdays', block.id)}
                            className="delete-btn"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="block-display">
                        <span className="block-time">{block.time}</span>
                        <span className="block-label">{block.label}</span>
                        <button 
                          onClick={() => setEditingBlock(block.id)}
                          className="edit-btn"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => handleAddTimeBlock('weekdays')}
                  className="add-block-btn"
                >
                  <Plus size={16} />
                  Add Block
                </button>
              </div>
            </div>

            {/* Weekend Blocks */}
            <div className="day-type-section">
              <h3>Weekend Blocks</h3>
              <div className="blocks-list">
                {timeBlocks.weekends.map(block => (
                  <div key={block.id} className="time-block-item">
                    {editingBlock === block.id ? (
                      <div className="edit-block-form">
                        <input
                          type="time"
                          value={block.time}
                          onChange={(e) => handleTimeBlockChange('weekends', block.id, 'time', e.target.value)}
                          className="time-input"
                        />
                        <input
                          type="text"
                          placeholder="Label (e.g., Morning)"
                          value={block.label}
                          onChange={(e) => handleTimeBlockChange('weekends', block.id, 'label', e.target.value)}
                          className="label-input"
                        />
                        <div className="edit-actions">
                          <button 
                            onClick={() => setEditingBlock(null)}
                            className="save-btn"
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTimeBlock('weekends', block.id)}
                            className="delete-btn"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="block-display">
                        <span className="block-time">{block.time}</span>
                        <span className="block-label">{block.label}</span>
                        <button 
                          onClick={() => setEditingBlock(block.id)}
                          className="edit-btn"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => handleAddTimeBlock('weekends')}
                  className="add-block-btn"
                >
                  <Plus size={16} />
                  Add Block
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Regional Management */}
        <motion.div 
          className="tbm-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="section-header">
            <MapPin className="section-icon" />
            <h2>Regional Management</h2>
          </div>

          <div className="regions-grid">
            {(regions || []).filter(region => region).map(region => (
              <div key={region.id} className="region-card">
                {editingRegion === region.id ? (
                  <div className="edit-region-form">
                    <input
                      type="text"
                      placeholder="Region Name"
                      value={region.name}
                      onChange={(e) => handleRegionChange(region.id, 'name', e.target.value)}
                      className="region-name-input"
                    />
                    <div className="reps-input">
                      <input
                        type="text"
                        placeholder="Rep names (comma separated)"
                        value={(region.reps || []).join(', ')}
                        onChange={(e) => handleRegionChange(region.id, 'reps', e.target.value.split(',').map(r => r.trim()).filter(r => r.length > 0))}
                        className="reps-input-field"
                      />
                    </div>
                    <div className="edit-actions">
                      <button 
                        onClick={() => setEditingRegion(null)}
                        className="save-btn"
                      >
                        <Save size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRegion(region.id)}
                        className="delete-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="region-display">
                    <div className="region-header">
                      <div 
                        className="region-color"
                        style={{ backgroundColor: region.color }}
                      ></div>
                      <h3>{region.name}</h3>
                      <button 
                        onClick={() => setEditingRegion(region.id)}
                        className="edit-btn"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                    <div className="region-reps">
                      <Users size={16} />
                      <span>{(region.reps || []).length} Reps</span>
                    </div>
                    <div className="reps-list">
                      {(region.reps || []).map((rep, index) => (
                        <span key={index} className="rep-name">{rep}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button 
              onClick={handleAddRegion}
              className="add-region-btn"
            >
              <Plus size={16} />
              Add Region
            </button>
          </div>
        </motion.div>

        {/* Availability Calendar */}
        <motion.div 
          className="tbm-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="section-header">
            <Calendar className="section-icon" />
            <h2>Availability Calendar (Next 3 Weeks)</h2>
          </div>

          <div className="availability-calendar">
            {dates.map(date => {
              const dateStr = date.toISOString().split('T')[0];
              const blocksForDate = getTimeBlocksForDate(date);
              const isPast = date < new Date();
              
              return (
                <div key={dateStr} className={`calendar-day ${isPast ? 'past' : ''}`}>
                  <div className="day-header">
                    <span className="day-date">{formatDate(date)}</span>
                    {isWeekend(date) && <span className="weekend-badge">Weekend</span>}
                  </div>
                  
                  <div className="day-blocks">
                    {blocksForDate.map(block => (
                      <div key={block.id} className="availability-block">
                        <div className="block-info">
                          <span className="block-time">{block.time}</span>
                          <span className="block-label">{block.label}</span>
                        </div>
                        
                                                 <div className="region-availability">
                           {regions.map(region => {
                             const slotData = availability[dateStr]?.slots?.[block.id]?.[region.id];
                             const isAvailable = slotData?.available !== false;
                             const booked = slotData?.booked || 0;
                             const capacity = slotData?.capacity || 3;
                             
                             return (
                               <button
                                 key={region.id}
                                 className={`region-availability-btn ${isAvailable ? 'available' : 'unavailable'}`}
                                 onClick={() => !isPast && handleAvailabilityChange(dateStr, block.id, region.id, !isAvailable)}
                                 disabled={isPast}
                                 style={{ 
                                   backgroundColor: isAvailable ? region.color : '#e5e7eb',
                                   opacity: isPast ? 0.5 : 1
                                 }}
                                 title={`${region.name}: ${isAvailable ? 'Available' : 'Unavailable'} (${booked}/${capacity} booked)`}
                               >
                                 {region.name} ({booked}/{capacity})
                               </button>
                             );
                           })}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TimeBlockManagement; 