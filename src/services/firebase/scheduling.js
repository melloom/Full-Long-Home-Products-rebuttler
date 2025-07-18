import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { getDb } from './config';

// Collection names
const TIMEBLOCKS_COLLECTION = 'timeBlocks';
const REGIONS_COLLECTION = 'regions';
const AVAILABILITY_COLLECTION = 'availability';
const BOOKINGS_COLLECTION = 'bookings';

// --- TIME BLOCKS ---
export const getTimeBlocks = async () => {
  const db = getDb();
  const snapshot = await getDocs(collection(db, TIMEBLOCKS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const listenTimeBlocks = (cb) => {
  const db = getDb();
  return onSnapshot(collection(db, TIMEBLOCKS_COLLECTION), snap => cb(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
};
export const setTimeBlock = async (id, data) => {
  const db = getDb();
  return setDoc(doc(db, TIMEBLOCKS_COLLECTION, id), data, { merge: true });
};
export const addTimeBlock = async (data) => {
  const db = getDb();
  return addDoc(collection(db, TIMEBLOCKS_COLLECTION), data);
};
export const deleteTimeBlock = async (id) => {
  const db = getDb();
  return deleteDoc(doc(db, TIMEBLOCKS_COLLECTION, id));
};

// --- REGIONS ---
export const getRegions = async () => {
  const db = getDb();
  const snapshot = await getDocs(collection(db, REGIONS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const listenRegions = (cb) => {
  const db = getDb();
  return onSnapshot(collection(db, REGIONS_COLLECTION), snap => cb(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
};
export const setRegion = async (id, data) => {
  const db = getDb();
  return setDoc(doc(db, REGIONS_COLLECTION, id), data, { merge: true });
};
export const addRegion = async (data) => {
  const db = getDb();
  return addDoc(collection(db, REGIONS_COLLECTION), data);
};
export const deleteRegion = async (id) => {
  const db = getDb();
  return deleteDoc(doc(db, REGIONS_COLLECTION, id));
};

// --- AVAILABILITY ---
// Updated structure: { [date]: { [regionId]: { [timeBlockId]: { available: number, capacity: number } } } }
export const getAvailability = async (region = null) => {
  const db = getDb();
  console.log('🔍 Fetching availability for region:', region);
  
  if (region) {
    // Get availability for specific region
    const q = query(collection(db, AVAILABILITY_COLLECTION), where(`regions.${region}`, '!=', null));
    const snapshot = await getDocs(q);
    
    const availability = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('📅 Availability data for date:', doc.id, data);
      if (data && data.regions && data.regions[region]) {
        availability[doc.id] = data.regions[region];
      }
    });
    
    console.log('✅ Final availability for region:', region, availability);
    return availability;
  } else {
    // Get all availability
    const snapshot = await getDocs(collection(db, AVAILABILITY_COLLECTION));
    const availability = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('📅 Availability data for date:', doc.id, data);
      if (data) {
        availability[doc.id] = data;
      }
    });
    console.log('✅ Final availability for all regions:', availability);
    return availability;
  }
};

export const getAvailabilityForRegion = async (region) => {
  return getAvailability(region);
};

export const listenAvailability = (date, cb) => {
  const db = getDb();
  return onSnapshot(doc(db, AVAILABILITY_COLLECTION, date), snap => cb(snap.exists() ? snap.data() : null));
};

export const listenAvailabilityForRegion = (region, cb) => {
  const db = getDb();
  console.log('🔄 Setting up real-time listener for region:', region);
  
  return onSnapshot(collection(db, AVAILABILITY_COLLECTION), (snapshot) => {
    const availability = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('📅 Real-time availability data for date:', doc.id, data);
      
      if (data && data.regions && data.regions[region]) {
        availability[doc.id] = data.regions[region];
      }
    });
    
    console.log('✅ Real-time availability for region:', region, availability);
    cb(availability);
  });
};

export const setAvailability = async (date, data) => {
  const db = getDb();
  return setDoc(doc(db, AVAILABILITY_COLLECTION, date), data, { merge: true });
};

// Update availability for a specific region and date
export const updateRegionAvailability = async (date, region, timeBlockId, available, capacity) => {
  const db = getDb();
  const ref = doc(db, AVAILABILITY_COLLECTION, date);
  
  const updateData = {
    [`regions.${region}.${timeBlockId}`]: {
      available,
      capacity,
      updatedAt: serverTimestamp()
    }
  };
  
  return updateDoc(ref, updateData);
};

// --- BOOKINGS ---
export const getBookingsForDate = async (date) => {
  const db = getDb();
  const q = query(collection(db, BOOKINGS_COLLECTION), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const addBooking = async (booking) => {
  const db = getDb();
  return addDoc(collection(db, BOOKINGS_COLLECTION), { ...booking, createdAt: serverTimestamp() });
};
export const listenBookingsForDate = (date, cb) => {
  const db = getDb();
  const q = query(collection(db, BOOKINGS_COLLECTION), where('date', '==', date));
  return onSnapshot(q, snap => cb(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
}; 