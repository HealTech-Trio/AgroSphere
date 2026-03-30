import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { auth, firestore } from '../../../../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  onSnapshot 
} from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

export const useStorage = () => {
  const saveCrops = async (crops) => {
    try {
      const jsonValue = JSON.stringify(crops);
      await AsyncStorage.setItem(STORAGE_KEYS.CROPS_DATA, jsonValue);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getCrops = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CROPS_DATA);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      return [];
    }
  };

  const addToSyncQueue = async (operation, data) => {
    try {
      const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      const queue = queueJson ? JSON.parse(queueJson) : [];
      
      queue.push({
        operation,
        data,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      });
      
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      return true;
    } catch (error) {
      return false;
    }
  };

  const getSyncQueue = async () => {
    try {
      const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      return [];
    }
  };

  const clearSyncQueue = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
      return true;
    } catch (error) {
      return false;
    }
  };

  const syncCropToFirebase = async (operation, cropData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        await addToSyncQueue(operation, cropData);
        return false;
      }

      const farmId = cropData.farmId;
      if (!farmId) {
        return false;
      }

      switch (operation) {
        case 'CREATE':
          // Remove local ID before saving to Firebase
          const { id: localId, ...firebaseData } = cropData;
          const docRef = await addDoc(
            collection(firestore, 'users', user.uid, 'farms', farmId, 'crops'),
            {
              ...firebaseData,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          );
          
          // Update local storage with Firebase ID
          const currentCrops = await getCrops();
          const updatedCrops = currentCrops.map(crop => 
            crop.id === localId ? { ...crop, id: docRef.id, firebaseId: docRef.id } : crop
          );
          await saveCrops(updatedCrops);
          break;

        case 'UPDATE':
          const firebaseId = cropData.firebaseId || cropData.id;
          await updateDoc(
            doc(firestore, 'users', user.uid, 'farms', farmId, 'crops', firebaseId),
            {
              ...cropData,
              updatedAt: new Date()
            }
          );
          break;

        case 'DELETE':
          const deleteFirebaseId = cropData.firebaseId || cropData.id;
          await deleteDoc(
            doc(firestore, 'users', user.uid, 'farms', farmId, 'crops', deleteFirebaseId)
          );
          break;
      }

      return true;
    } catch (error) {
      // Add to sync queue for retry
      await addToSyncQueue(operation, cropData);
      return false;
    }
  };

  const processSyncQueue = async () => {
    try {
      const queue = await getSyncQueue();
      if (queue.length === 0) return;

      const user = auth.currentUser;
      if (!user) return;

      const successfulOperations = [];

      for (const operation of queue) {
        try {
          const success = await syncCropToFirebase(operation.operation, operation.data);
          if (success) {
            successfulOperations.push(operation.id);
          }
        } catch (error) {
        }
      }

      // Remove successful operations from queue
      if (successfulOperations.length > 0) {
        const updatedQueue = queue.filter(op => !successfulOperations.includes(op.id));
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));
      }

      return successfulOperations.length;
    } catch (error) {
      return 0;
    }
  };

  const loadCropsFromFirebase = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      // Get all farms first
      const farmsQuery = query(collection(firestore, 'users', user.uid, 'farms'));
      const farmsSnapshot = await getDocs(farmsQuery);
      
      let allCrops = [];

      // Get crops from each farm
      for (const farmDoc of farmsSnapshot.docs) {
        const farmId = farmDoc.id;
        const cropsQuery = query(
          collection(firestore, 'users', user.uid, 'farms', farmId, 'crops')
        );
        const cropsSnapshot = await getDocs(cropsQuery);
        
        const farmCrops = cropsSnapshot.docs.map(doc => ({
          id: doc.id,
          firebaseId: doc.id,
          farmId: farmId,
          farmName: farmDoc.data().name,
          ...doc.data()
        }));

        allCrops = [...allCrops, ...farmCrops];
      }

      // Save to local storage
      await saveCrops(allCrops);
      return allCrops;
    } catch (error) {
      return await getCrops(); // Fallback to local storage
    }
  };

  const setupCropsListener = (callback) => {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      let allCrops = [];
      let unsubscribeFunctions = [];

      // Listen to all farms
      const farmsQuery = query(collection(firestore, 'users', user.uid, 'farms'));
      const farmsUnsubscribe = onSnapshot(farmsQuery, async (farmsSnapshot) => {
        const farmPromises = farmsSnapshot.docs.map(async (farmDoc) => {
          const farmId = farmDoc.id;
          
          return new Promise((resolve) => {
            const cropsQuery = query(
              collection(firestore, 'users', user.uid, 'farms', farmId, 'crops')
            );
            
            const cropsUnsubscribe = onSnapshot(cropsQuery, (cropsSnapshot) => {
              const farmCrops = cropsSnapshot.docs.map(doc => ({
                id: doc.id,
                firebaseId: doc.id,
                farmId: farmId,
                farmName: farmDoc.data().name,
                ...doc.data()
              }));

              // Update allCrops with crops from this farm
              allCrops = allCrops.filter(crop => crop.farmId !== farmId);
              allCrops = [...allCrops, ...farmCrops];
              
              // Send a copy to avoid reference issues
              callback([...allCrops]);
            });

            unsubscribeFunctions.push(cropsUnsubscribe);
            resolve();
          });
        });

        await Promise.all(farmPromises);
      });

      unsubscribeFunctions.push(farmsUnsubscribe);

      return () => {
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      };
    } catch (error) {
      return null;
    }
  };

  return {
    saveCrops,
    getCrops,
    addToSyncQueue,
    getSyncQueue,
    clearSyncQueue,
    syncCropToFirebase,
    processSyncQueue,
    loadCropsFromFirebase,
    setupCropsListener
  };
};