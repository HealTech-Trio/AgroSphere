import { useState, useEffect, useCallback } from 'react';
import { useStorage } from './useStorage';
import NetInfo from '@react-native-community/netinfo';

export const useCrops = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const { 
    saveCrops, 
    getCrops, 
    addToSyncQueue,
    syncCropToFirebase,
    processSyncQueue,
    loadCropsFromFirebase,
    setupCropsListener
  } = useStorage();

  // Monitor network status
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      
      if (state.isConnected) {
        processSyncQueue();
      }
    });

    return () => unsubscribeNetInfo();
  }, []);

  // Load crops and setup listener
  useEffect(() => {
    initializeCropsData();

    // Setup real-time listener for online users
    if (isOnline) {
      const unsubscribe = setupCropsListener((firebaseCrops) => {
        setCrops(firebaseCrops);
        saveCrops(firebaseCrops);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isOnline]);

  const initializeCropsData = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        const firebaseCrops = await loadCropsFromFirebase();
        setCrops(firebaseCrops);
      } else {
        const localCrops = await getCrops();
        setCrops(localCrops);
      }
    } catch (error) {
      const localCrops = await getCrops();
      setCrops(localCrops);
    }
    setLoading(false);
  };

  const addCrop = async (cropData) => {
    try {
      const newCrop = {
        id: Math.random().toString(36).substr(2, 9),
        ...cropData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Optimistic update
      const updatedCrops = [...crops, newCrop];
      setCrops(updatedCrops);
      
      // Save to storage
      await saveCrops(updatedCrops);
      
      // Sync to Firebase (fire and forget - don't await if it causes delays)
      if (isOnline) {
        syncCropToFirebase('CREATE', newCrop).catch(error => {
          // Add to sync queue for retry
          addToSyncQueue('CREATE', newCrop);
        });
      } else {
        await addToSyncQueue('CREATE', newCrop);
      }
      
      return newCrop;
    } catch (error) {
      // Revert optimistic update on error by refreshing from storage
      const localCrops = await getCrops();
      setCrops(localCrops);
      throw error;
    }
  };

  const updateCrop = async (cropId, updates) => {
    try {
      const existingCrop = crops.find(crop => crop.id === cropId);
      const isCompleting = updates.growthStage === 100 && existingCrop?.growthStage !== 100;
      
      // Optimistic update
      const updatedCrops = crops.map(crop =>
        crop.id === cropId 
          ? { 
              ...crop, 
              ...updates, 
              updatedAt: new Date().toISOString(),
              ...(updates.growthStage === 100 && { completed: true })
            }
          : crop
      );
      
      setCrops(updatedCrops);
      await saveCrops(updatedCrops);
      
      const updatedCrop = updatedCrops.find(crop => crop.id === cropId);
      
      // Sync to Firebase
      if (isOnline) {
        syncCropToFirebase('UPDATE', updatedCrop).catch(error => {
          addToSyncQueue('UPDATE', updatedCrop);
        });
      } else {
        await addToSyncQueue('UPDATE', updatedCrop);
      }
      
      return { 
        success: true, 
        justCompleted: isCompleting,
        updatedCrop 
      };
    } catch (error) {
      // Revert optimistic update on error
      const localCrops = await getCrops();
      setCrops(localCrops);
      throw error;
    }
  };

  const deleteCrop = async (cropId) => {
    try {
      const cropToDelete = crops.find(crop => crop.id === cropId);
      
      // Optimistic update
      const updatedCrops = crops.filter(crop => crop.id !== cropId);
      setCrops(updatedCrops);
      
      await saveCrops(updatedCrops);
      
      // Sync to Firebase
      if (isOnline) {
        syncCropToFirebase('DELETE', cropToDelete).catch(error => {
          addToSyncQueue('DELETE', cropToDelete);
        });
      } else {
        await addToSyncQueue('DELETE', cropToDelete);
      }
    } catch (error) {
      // Revert optimistic update on error
      const localCrops = await getCrops();
      setCrops(localCrops);
      throw error;
    }
  };

  const syncAllCrops = async () => {
    if (!isOnline) return false;
    
    try {
      const syncedCount = await processSyncQueue();
      await initializeCropsData();
      return syncedCount;
    } catch (error) {
      return false;
    }
  };

  const getCropStats = () => {
    const total = crops.length;
    
    const totalArea = crops.reduce((sum, crop) => {
      return sum + (parseFloat(crop.area) || 0);
    }, 0);
    
    const earlyStage = crops.filter(crop => (crop?.growthStage || 0) < 50).length;
    const lateStage = crops.filter(crop => (crop?.growthStage || 0) >= 50 && (crop?.growthStage || 0) < 100).length;
    const readyToHarvest = crops.filter(crop => (crop?.growthStage || 0) >= 90 && (crop?.growthStage || 0) < 100).length;
    const completedCrops = crops.filter(crop => (crop?.growthStage || 0) === 100).length;

    return { 
      total, 
      earlyStage,
      lateStage,
      totalArea: totalArea.toFixed(2),
      readyToHarvest,
      completed: completedCrops
    };
  };

  return {
    crops,
    loading,
    isOnline,
    addCrop,
    updateCrop,
    deleteCrop,
    getCropStats,
    refreshCrops: initializeCropsData, 
    syncAllCrops
  };
};