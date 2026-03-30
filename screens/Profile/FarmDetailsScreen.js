// screens/Profile/FarmDetailsScreen.js
import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '../../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import CONFIG from '../../config'; // Add this import

const FARM_STORAGE_KEY = '@user_farms';
const PENDING_SYNC_KEY = '@pending_sync_operations';

// Add Google Places API configuration
const GOOGLE_PLACES_API_KEY = CONFIG.GOOGLE_MAPS_API_KEY;
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

const FarmDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  
  const [farms, setFarms] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState([]);

  // Add location suggestion states
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  // Use refs to track listeners and prevent duplicates
  const unsubscribeRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Check network status
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      
      // If we just came online, try to sync pending operations
      if (state.isConnected && pendingSync.length > 0) {
        syncPendingOperations();
      }
    });

    return () => unsubscribeNetInfo();
  }, [pendingSync]);

  // Load farms and setup listener - ONLY ONCE
  useEffect(() => {
    initializeFarmsData();

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []); // Empty dependency array - run only once

  // Add location suggestions effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationQuery && locationQuery.length >= 3) {
        fetchLocationSuggestions(locationQuery);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [locationQuery]);

  // Fetch location suggestions function
  const fetchLocationSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.warn('Google Maps API key not configured');
      return;
    }

    setIsFetchingLocations(true);
    try {
      const response = await fetch(
        `${GOOGLE_PLACES_API_URL}?input=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&types=geocode`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        setLocationSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        console.log('Google Places API response:', data.status);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
    setIsFetchingLocations(false);
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setEditingFarm(prev => ({ ...prev, location: location.description }));
    setLocationQuery(location.description);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // Handle location input change
  const handleLocationChange = (text) => {
    setLocationQuery(text);
    setEditingFarm(prev => ({ ...prev, location: text }));
    
    if (text.length === 0) {
      setShowSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  // Clear suggestions when tapping outside
  const handleOutsideTap = () => {
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // Render location suggestion item
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleLocationSelect(item)}
    >
      <Ionicons name="location-outline" size={20} color="#666" />
      <Text style={styles.suggestionText}>{item.description}</Text>
    </TouchableOpacity>
  );

  const initializeFarmsData = async () => {
    try {
      // First load from local storage
      await loadFarmsFromStorage();
      
      // Then setup Firestore listener
      setupFirestoreListener();
    } catch (error) {
      console.error('Error initializing farms data:', error);
    }
  };

  const loadFarmsFromStorage = async () => {
    try {
      const storedFarms = await AsyncStorage.getItem(FARM_STORAGE_KEY);
      if (storedFarms) {
        const parsedFarms = JSON.parse(storedFarms);
        setFarms(parsedFarms);
        return parsedFarms;
      }
      return [];
    } catch (error) {
      console.error('Error loading farms from storage:', error);
      return [];
    }
  };

  const saveFarmsToStorage = async (farmsData) => {
    try {
      await AsyncStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farmsData));
    } catch (error) {
      console.error('Error saving farms to storage:', error);
    }
  };

  const setupFirestoreListener = () => {
    const user = auth.currentUser;
    if (!user) return;

    // Clean up previous listener if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const farmsQuery = query(
      collection(firestore, 'users', user.uid, 'farms')
    );

    const unsubscribe = onSnapshot(farmsQuery, 
      (snapshot) => {
        console.log('Firestore snapshot received:', snapshot.docs.length, 'farms');
        
        // Only update from Firestore if we're online
        if (isOnline) {
          const farmsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Prevent unnecessary updates if data is the same
          setFarms(prevFarms => {
            if (JSON.stringify(prevFarms) !== JSON.stringify(farmsData)) {
              saveFarmsToStorage(farmsData);
              return farmsData;
            }
            return prevFarms;
          });
        }
      },
      (error) => {
        console.error('Firestore listener error:', error);
        // Don't fall back to local storage here to avoid conflicts
      }
    );

    unsubscribeRef.current = unsubscribe;
  };

  const addPendingSyncOperation = async (operation) => {
    try {
      const pendingOps = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const operations = pendingOps ? JSON.parse(pendingOps) : [];
      operations.push({
        ...operation,
        timestamp: new Date().toISOString()
      });
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(operations));
      setPendingSync(operations);
    } catch (error) {
      console.error('Error adding pending sync operation:', error);
    }
  };

  const removePendingSyncOperation = async (operationId) => {
    try {
      const pendingOps = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const operations = pendingOps ? JSON.parse(pendingOps) : [];
      const filteredOps = operations.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filteredOps));
      setPendingSync(filteredOps);
    } catch (error) {
      console.error('Error removing pending sync operation:', error);
    }
  };

  const syncPendingOperations = async () => {
    try {
      const pendingOps = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const operations = pendingOps ? JSON.parse(pendingOps) : [];
      
      if (operations.length === 0) return;

      const user = auth.currentUser;
      if (!user) return;

      for (const operation of operations) {
        try {
          switch (operation.type) {
            case 'ADD':
              // For ADD operations, we need to check if the farm already exists
              const existingFarm = farms.find(farm => 
                farm.name === operation.data.name && 
                farm.location === operation.data.location
              );
              
              if (!existingFarm) {
                await addDoc(
                  collection(firestore, 'users', user.uid, 'farms'),
                  operation.data
                );
              }
              break;
            
            case 'UPDATE':
              await updateDoc(
                doc(firestore, 'users', user.uid, 'farms', operation.farmId),
                operation.data
              );
              break;
            
            case 'DELETE':
              await deleteDoc(
                doc(firestore, 'users', user.uid, 'farms', operation.farmId)
              );
              break;
          }
          await removePendingSyncOperation(operation.id);
        } catch (error) {
          console.error(`Error syncing operation ${operation.type}:`, error);
        }
      }

      // Force refresh from Firestore after sync
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      setupFirestoreListener();

    } catch (error) {
      console.error('Error syncing pending operations:', error);
    }
  };

  // Calculate stats from real data
  const calculateStats = () => {
    const totalFarms = farms.length;
    
    const totalHectares = farms.reduce((total, farm) => {
      const sizeMatch = farm.size?.match(/(\d+)/);
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;
      return total + size;
    }, 0);
    
    const cropTypes = new Set(farms.map(farm => farm.cropType).filter(Boolean)).size;

    return { totalFarms, totalHectares, cropTypes };
  };

  const { totalFarms, totalHectares, cropTypes } = calculateStats();

  const handleAddFarm = () => {
    setIsEditing(true);
    setEditingFarm({
      name: '',
      size: '',
      location: '',
      cropType: '',
      soilType: '',
      irrigation: '',
    });
    setLocationQuery(''); // Reset location query
  };

  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleSaveFarm = async () => {
    if (!editingFarm.name.trim()) {
      Alert.alert('Error', 'Please enter a farm name');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const farmData = {
        name: editingFarm.name.trim(),
        size: editingFarm.size.trim(),
        location: editingFarm.location.trim(),
        cropType: editingFarm.cropType.trim(),
        soilType: editingFarm.soilType.trim(),
        irrigation: editingFarm.irrigation.trim(),
        updatedAt: new Date(),
      };

      let newFarms;
      
      if (editingFarm.id) {
        // Update existing farm
        const operationId = generateLocalId();
        
        // Update locally immediately
        newFarms = farms.map(farm => 
          farm.id === editingFarm.id 
            ? { ...farm, ...farmData }
            : farm
        );
        setFarms(newFarms);
        await saveFarmsToStorage(newFarms);

        // Add to sync queue
        await addPendingSyncOperation({
          id: operationId,
          type: 'UPDATE',
          farmId: editingFarm.id,
          data: farmData
        });

        // Try to sync immediately if online
        if (isOnline) {
          try {
            await updateDoc(
              doc(firestore, 'users', user.uid, 'farms', editingFarm.id),
              farmData
            );
            await removePendingSyncOperation(operationId);
          } catch (error) {
            console.error('Online update failed, keeping in sync queue:', error);
          }
        }

        Alert.alert('Success', 'Farm updated successfully!');
      } else {
        // Add new farm - Check for duplicates first
        const duplicateFarm = farms.find(farm => 
          farm.name.toLowerCase() === farmData.name.toLowerCase() &&
          farm.location.toLowerCase() === farmData.location.toLowerCase()
        );

        if (duplicateFarm) {
          Alert.alert('Duplicate Farm', 'A farm with this name and location already exists.');
          setLoading(false);
          return;
        }

        const operationId = generateLocalId();
        const localFarmId = generateLocalId();
        
        const newFarm = {
          id: localFarmId,
          ...farmData,
          createdAt: new Date(),
          isLocal: true
        };

        // Add locally immediately
        newFarms = [...farms, newFarm];
        setFarms(newFarms);
        await saveFarmsToStorage(newFarms);

        // Add to sync queue
        await addPendingSyncOperation({
          id: operationId,
          type: 'ADD',
          data: farmData,
          localId: localFarmId
        });

        // Try to sync immediately if online
        if (isOnline) {
          try {
            const docRef = await addDoc(
              collection(firestore, 'users', user.uid, 'farms'),
              farmData
            );
            
            // Update local ID with Firestore ID and remove local flag
            const updatedFarms = newFarms.map(farm => 
              farm.id === localFarmId 
                ? { ...farm, id: docRef.id, isLocal: undefined }
                : farm
            );
            setFarms(updatedFarms);
            await saveFarmsToStorage(updatedFarms);
            await removePendingSyncOperation(operationId);
          } catch (error) {
            console.error('Online add failed, keeping in sync queue:', error);
          }
        }

        Alert.alert('Success', 'Farm added successfully!');
      }

      setIsEditing(false);
      setEditingFarm(null);
      setLocationQuery(''); // Reset location query
      setShowSuggestions(false); // Hide suggestions
      
    } catch (error) {
      console.error('Error saving farm:', error);
      Alert.alert('Error', 'Failed to save farm. Please try again.');
    }
    setLoading(false);
  };

  const handleEditFarm = (farm) => {
    setIsEditing(true);
    setEditingFarm({ ...farm });
    setLocationQuery(farm.location || ''); // Set location query for editing
  };

  const handleDeleteFarm = async (farmId) => {
    Alert.alert(
      'Delete Farm',
      'Are you sure you want to delete this farm? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('Error', 'User not authenticated');
                return;
              }

              const operationId = generateLocalId();
              
              // Delete locally immediately
              const newFarms = farms.filter(farm => farm.id !== farmId);
              setFarms(newFarms);
              await saveFarmsToStorage(newFarms);

              // Add to sync queue
              await addPendingSyncOperation({
                id: operationId,
                type: 'DELETE',
                farmId: farmId
              });

              // Try to sync immediately if online
              if (isOnline) {
                try {
                  await deleteDoc(
                    doc(firestore, 'users', user.uid, 'farms', farmId)
                  );
                  await removePendingSyncOperation(operationId);
                } catch (error) {
                  console.error('Online delete failed, keeping in sync queue:', error);
                }
              }

              Alert.alert('Success', 'Farm deleted successfully');
            } catch (error) {
              console.error('Error deleting farm:', error);
              Alert.alert('Error', 'Failed to delete farm. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingFarm(null);
    setLocationQuery(''); // Reset location query
    setShowSuggestions(false); // Hide suggestions
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsideTap}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Header with sync status */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Farm Details</Text>
            {!isOnline && (
              <Text style={styles.offlineIndicator}>Offline</Text>
            )}
            {pendingSync.length > 0 && (
              <Text style={styles.syncIndicator}>
                {pendingSync.length} pending sync
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddFarm}
            disabled={isEditing}
          >
            <Ionicons name="add" size={24} color="#0B8457" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {isEditing ? (
            // Edit/Add Farm Form
            <View style={styles.editContainer}>
              <Text style={styles.editTitle}>
                {editingFarm.id ? 'Edit Farm' : 'Add New Farm'}
              </Text>
              
              {!isOnline && (
                <View style={styles.offlineBanner}>
                  <Ionicons name="cloud-offline" size={16} color="#666" />
                  <Text style={styles.offlineBannerText}>
                    You're offline. Changes will sync when you're back online.
                  </Text>
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Farm Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editingFarm.name}
                  onChangeText={(text) => setEditingFarm(prev => ({ ...prev, name: text }))}
                  placeholder="Enter farm name"
                  placeholderTextColor="#9B9B9B"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Farm Size</Text>
                <TextInput
                  style={styles.input}
                  value={editingFarm.size}
                  onChangeText={(text) => setEditingFarm(prev => ({ ...prev, size: text }))}
                  placeholder="e.g., 50 hectares"
                  placeholderTextColor="#9B9B9B"
                  editable={!loading}
                />
              </View>

              <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.locationInputContainer}>
                  <TextInput
                    style={styles.input}
                    value={locationQuery}
                    onChangeText={handleLocationChange}
                    placeholder="Start typing your location..."
                    placeholderTextColor="#9B9B9B"
                    editable={!loading}
                    onFocus={() => locationQuery.length >= 3 && setShowSuggestions(true)}
                  />
                  {isFetchingLocations && (
                    <View style={styles.loadingIndicator}>
                      <Ionicons name="search" size={20} color="#999" />
                    </View>
                  )}
                </View>
                
                {showSuggestions && locationSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {locationSuggestions.map((item) => (
                      <TouchableOpacity
                        key={item.place_id}
                        style={styles.suggestionItem}
                        onPress={() => handleLocationSelect(item)}
                      >
                        <Ionicons name="location-outline" size={20} color="#666" />
                        <Text style={styles.suggestionText}>{item.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Crop Type</Text>
                <TextInput
                  style={styles.input}
                  value={editingFarm.cropType}
                  onChangeText={(text) => setEditingFarm(prev => ({ ...prev, cropType: text }))}
                  placeholder="e.g., Maize, Wheat"
                  placeholderTextColor="#9B9B9B"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Soil Type</Text>
                <TextInput
                  style={styles.input}
                  value={editingFarm.soilType}
                  onChangeText={(text) => setEditingFarm(prev => ({ ...prev, soilType: text }))}
                  placeholder="e.g., Loamy, Sandy"
                  placeholderTextColor="#9B9B9B"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Irrigation System</Text>
                <TextInput
                  style={styles.input}
                  value={editingFarm.irrigation}
                  onChangeText={(text) => setEditingFarm(prev => ({ ...prev, irrigation: text }))}
                  placeholder="e.g., Drip, Sprinkler"
                  placeholderTextColor="#9B9B9B"
                  editable={!loading}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton, loading && styles.buttonDisabled]} 
                  onPress={handleCancelEdit}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]} 
                  onPress={handleSaveFarm}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : isOnline ? 'Save Farm' : 'Save Locally'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Farms List View (unchanged)
            <>
              {/* Quick Stats Card */}
              <View style={styles.statsCard}>
                <LinearGradient
                  colors={['rgba(11, 132, 87, 0.1)', 'rgba(11, 132, 87, 0.05)']}
                  style={styles.statsGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{totalFarms}</Text>
                      <Text style={styles.statLabel}>Total Farms</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{totalHectares}</Text>
                      <Text style={styles.statLabel}>Hectares</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{cropTypes}</Text>
                      <Text style={styles.statLabel}>Crop Types</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Sync Status Banner */}
              {!isOnline && (
                <View style={styles.syncBanner}>
                  <Ionicons name="cloud-offline" size={20} color="#666" />
                  <Text style={styles.syncBannerText}>
                    You're offline. {pendingSync.length > 0 ? `${pendingSync.length} changes pending sync` : 'Working offline'}
                  </Text>
                </View>
              )}

              {/* Farms List */}
              <View style={styles.farmsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Farms</Text>
                  <TouchableOpacity 
                    style={styles.addSmallButton}
                    onPress={handleAddFarm}
                  >
                    <Ionicons name="add" size={20} color="#0B8457" />
                    <Text style={styles.addButtonText}>Add Farm</Text>
                  </TouchableOpacity>
                </View>
                
                {farms.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="business-outline" size={64} color="#E0E0E0" />
                    <Text style={styles.emptyTitle}>No Farms Added</Text>
                    <Text style={styles.emptyText}>
                      Add your first farm to get started with farm management
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyButton}
                      onPress={handleAddFarm}
                    >
                      <Text style={styles.emptyButtonText}>Add First Farm</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  farms.map((farm) => (
                    <View key={farm.id} style={styles.farmCard}>
                      <View style={styles.farmHeader}>
                        <View style={styles.farmNameContainer}>
                          <Ionicons name="business" size={20} color="#0B8457" />
                          <Text style={styles.farmName}>{farm.name}</Text>
                          {farm.isLocal && (
                            <Ionicons name="cloud-offline" size={14} color="#FFA500" style={styles.localIndicator} />
                          )}
                        </View>
                        <View style={styles.farmActions}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleEditFarm(farm)}
                          >
                            <Ionicons name="pencil" size={18} color="#0B8457" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleDeleteFarm(farm.id)}
                          >
                            <Ionicons name="trash" size={18} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={styles.farmDetails}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Ionicons name="location" size={14} color="#9B9B9B" />
                            <Text style={styles.detailText}>{farm.location || 'Not specified'}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Ionicons name="resize" size={14} color="#9B9B9B" />
                            <Text style={styles.detailText}>{farm.size || 'Not specified'}</Text>
                          </View>
                        </View>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Ionicons name="leaf" size={14} color="#9B9B9B" />
                            <Text style={styles.detailText}>{farm.cropType || 'Not specified'}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Ionicons name="water" size={14} color="#9B9B9B" />
                            <Text style={styles.detailText}>{farm.irrigation || 'Not specified'}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  offlineIndicator: {
    fontSize: 10,
    color: '#FF6B6B',
    marginTop: 2,
  },
  syncIndicator: {
    fontSize: 10,
    color: '#FFA500',
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B8457',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  syncBannerText: {
    marginLeft: 8,
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
  },
  farmsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2332',
  },
  addSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#0B8457',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#0B8457',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  farmCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginLeft: 8,
    flex: 1,
  },
  localIndicator: {
    marginLeft: 6,
  },
  farmActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  },
  farmDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#9B9B9B',
    marginLeft: 6,
  },
  editContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 1,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 16,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  offlineBannerText: {
    marginLeft: 8,
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
    zIndex: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2332',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#1A2332',
  },
  locationInputContainer: {
    position: 'relative',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: '#0B8457',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default FarmDetailsScreen;