import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query,
  onSnapshot
} from 'firebase/firestore';
import { firestore, auth } from '../../../../firebase';

const SCHEDULES_STORAGE_KEY = '@agrisphere_schedules';

// Simple network check
const isOnline = () => true;

// Get the user-specific schedules collection path
const getUserSchedulesCollection = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return collection(firestore, 'users', user.uid, 'schedules');
};

// Get a specific schedule document reference
const getScheduleDoc = (scheduleId) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return doc(firestore, 'users', user.uid, 'schedules', scheduleId);
};

// Safe date conversion
const safeDateToISOString = (dateValue) => {
  try {
    if (!dateValue) return null;
    
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      const date = new Date(dateValue);
      return !isNaN(date.getTime()) ? dateValue : null;
    }
    
    if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
      const date = dateValue.toDate();
      return !isNaN(date.getTime()) ? date.toISOString() : null;
    }
    
    if (dateValue instanceof Date) {
      return !isNaN(dateValue.getTime()) ? dateValue.toISOString() : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error converting date to ISO string:', error);
    return null;
  }
};

// Process schedule data from Firebase
const processScheduleFromFirebase = (scheduleData) => {
  if (!scheduleData) return null;
  
  const processed = { ...scheduleData };
  
  if (scheduleData.date) {
    processed.date = safeDateToISOString(scheduleData.date);
  }
  
  if (scheduleData.time) {
    processed.time = safeDateToISOString(scheduleData.time);
  }
  
  if (scheduleData.lastUpdated) {
    processed.lastUpdated = safeDateToISOString(scheduleData.lastUpdated);
  }
  
  return processed;
};

// Sync all schedules to Firebase
const syncSchedulesToFirebase = async (schedules) => {
  try {
    const user = auth.currentUser;
    if (!user || !isOnline()) return false;

    const schedulesCollection = getUserSchedulesCollection();
    
    // First, get all existing schedules from Firebase to compare
    const existingSchedulesQuery = query(schedulesCollection);
    const existingSnapshot = await getDocs(existingSchedulesQuery);
    const existingScheduleIds = new Set();
    
    existingSnapshot.forEach((doc) => {
      existingScheduleIds.add(doc.id);
    });

    const batchWrites = [];
    
    // Delete schedules that are in Firebase but not in our current list
    existingScheduleIds.forEach(scheduleId => {
      if (!schedules.find(s => s.id === scheduleId)) {
        // This schedule exists in Firebase but not in our current list - delete it
        const scheduleRef = doc(schedulesCollection, scheduleId);
        batchWrites.push(deleteDoc(scheduleRef));
        console.log('Marking schedule for deletion from Firebase:', scheduleId);
      }
    });

    // Add/update schedules that are in our current list
    schedules.forEach((schedule) => {
      const scheduleRef = doc(schedulesCollection, schedule.id);
      const scheduleData = {
        ...schedule,
        lastUpdated: new Date().toISOString()
      };
      
      batchWrites.push(setDoc(scheduleRef, scheduleData));
    });

    // Execute all operations
    await Promise.all(batchWrites);
    console.log('Successfully synced', schedules.length, 'schedules to Firebase, deleted', (existingScheduleIds.size - schedules.length), 'schedules');
    return true;
  } catch (error) {
    console.error('Error syncing schedules to Firebase:', error);
    return false;
  }
};

// Load schedules from Firebase
const loadSchedulesFromFirebase = async () => {
  try {
    const user = auth.currentUser;
    if (!user || !isOnline()) return [];

    const schedulesCollection = getUserSchedulesCollection();
    const schedulesQuery = query(schedulesCollection);
    
    const querySnapshot = await getDocs(schedulesQuery);
    const schedules = [];
    
    querySnapshot.forEach((doc) => {
      const scheduleData = processScheduleFromFirebase(doc.data());
      if (scheduleData) {
        schedules.push(scheduleData);
      }
    });

    return schedules.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });
  } catch (error) {
    console.error('Error loading schedules from Firebase:', error);
    return [];
  }
};

// Save individual schedule to Firebase
const saveScheduleToFirebase = async (scheduleData) => {
  try {
    const user = auth.currentUser;
    if (!user || !isOnline()) return false;

    const scheduleRef = getScheduleDoc(scheduleData.id);
    
    await setDoc(scheduleRef, {
      ...scheduleData,
      lastUpdated: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error saving schedule to Firebase:', error);
    return false;
  }
};

// Delete schedule from Firebase
export const deleteSchedule = async (scheduleId) => {
  try {
    // Delete from local storage first
    const currentSchedules = await getSchedules();
    const newSchedules = currentSchedules.filter(s => s.id !== scheduleId);
    
    // Update local storage
    const jsonSchedules = JSON.stringify(newSchedules);
    await AsyncStorage.setItem(SCHEDULES_STORAGE_KEY, jsonSchedules);
    
    // Delete from Firebase if online
    if (isOnline()) {
      await deleteScheduleFromFirebase(scheduleId);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return false;
  }
};

// Main storage functions
export const saveSchedule = async (schedules) => {
  try {
    // Always save to local storage first
    const jsonSchedules = JSON.stringify(schedules);
    await AsyncStorage.setItem(SCHEDULES_STORAGE_KEY, jsonSchedules);
    
    // Sync to Firebase if online
    if (isOnline()) {
      await syncSchedulesToFirebase(schedules);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving schedules:', error);
    return false;
  }
};

export const getSchedules = async () => {
  try {
    // Try to load from Firebase first if online
    if (isOnline()) {
      try {
        const firebaseSchedules = await loadSchedulesFromFirebase();
        if (firebaseSchedules.length > 0) {
          // Update local storage with Firebase data
          await AsyncStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(firebaseSchedules));
          return firebaseSchedules;
        }
      } catch (firebaseError) {
        console.log('Failed to load from Firebase, using local storage:', firebaseError);
      }
    }
    
    // Fall back to local storage
    const jsonSchedules = await AsyncStorage.getItem(SCHEDULES_STORAGE_KEY);
    const schedules = jsonSchedules ? JSON.parse(jsonSchedules) : [];
    
    return schedules.map(schedule => processScheduleFromFirebase(schedule)).filter(Boolean);
  } catch (error) {
    console.error('Error loading schedules:', error);
    return [];
  }
};

export const clearSchedules = async () => {
  try {
    await AsyncStorage.removeItem(SCHEDULES_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing schedules:', error);
    return false;
  }
};

// Setup real-time listener - UPDATED to prevent infinite loops
export const setupSchedulesListener = (callback) => {
  try {
    const user = auth.currentUser;
    if (!user) return () => {};

    const schedulesCollection = getUserSchedulesCollection();
    const schedulesQuery = query(schedulesCollection);

    const unsubscribe = onSnapshot(schedulesQuery, (querySnapshot) => {
      const schedules = [];
      querySnapshot.forEach((doc) => {
        const scheduleData = processScheduleFromFirebase(doc.data());
        if (scheduleData) {
          schedules.push(scheduleData);
        }
      });
      
      const sortedSchedules = schedules.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateA - dateB;
      });
      
      console.log('Firestore schedules snapshot received:', sortedSchedules.length, 'schedules');
      callback(sortedSchedules);
      
    }, (error) => {
      console.error('Schedules listener error:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up schedules listener:', error);
    return () => {};
  }
};

export { isOnline };