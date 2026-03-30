import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  BackHandler,
  TouchableOpacity,
  Text,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Components
import CalendarView from './components/CalendarView';
import ScheduleHeader from './components/ScheduleHeader';
import SchedulesListView from './components/SchedulesListView';
import ScheduleModal from './components/ScheduleModal';

// Storage
import { saveSchedule, getSchedules, setupSchedulesListener } from './utils/storage';

// NOTIFICATIONS & CROPS
import { useNotifications } from '../../../context/NotificationsContext';
import { useCrops } from '../MyCrops/hooks/useCrops'; // Import crops hook

const ScheduleScreen = () => {
  const navigation = useNavigation();
  const { addCropScheduleNotification } = useNotifications();
  const { crops } = useCrops(); // Get crops from MyCrops
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    initializeSchedulesData();
    setupNetworkListener();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const setupNetworkListener = () => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    return unsubscribeNetInfo;
  };

  const initializeSchedulesData = async () => {
    try {
      await loadSchedulesFromStorage();
      setupFirestoreListener();
    } catch (error) {
      console.error('Error initializing schedules data:', error);
    }
  };

  const loadSchedulesFromStorage = async () => {
    try {
      const storedSchedules = await getSchedules();
      setSchedules(storedSchedules || []);
    } catch (error) {
      console.error('Error loading schedules from storage:', error);
    }
  };

  const setupFirestoreListener = () => {
    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const unsubscribe = setupSchedulesListener((firebaseSchedules) => {
        console.log('Firestore schedules snapshot received:', firebaseSchedules.length, 'schedules');
        
        if (firebaseSchedules && firebaseSchedules.length >= 0) {
          setSchedules(firebaseSchedules);
          updateLocalStorageSilently(firebaseSchedules);
        }
      });

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error setting up Firestore listener:', error);
    }
  };

  const updateLocalStorageSilently = async (schedules) => {
    try {
      const jsonSchedules = JSON.stringify(schedules);
      await AsyncStorage.setItem('@agrisphere_schedules', jsonSchedules);
    } catch (error) {
      console.error('Error updating local storage silently:', error);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
    return true;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setIsModalVisible(true);
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setIsModalVisible(true);
  };

  const handleSaveSchedule = async (scheduleData) => {
    // Prevent multiple saves
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      const isEditing = !!selectedSchedule;
      let newSchedules;
      
      if (isEditing) {
        newSchedules = schedules.map(s => 
          s.id === selectedSchedule.id ? { ...scheduleData, id: selectedSchedule.id } : s
        );
      } else {
        const newId = Date.now().toString();
        newSchedules = [...schedules, { ...scheduleData, id: newId }];
      }
      
      // Save to both local storage and Firebase
      await saveSchedule(newSchedules);
      setSchedules(newSchedules);
      
      // Close the modal FIRST
      setIsModalVisible(false);
      setSelectedSchedule(null);
      
      // Get crop name and activity type
      const cropName = scheduleData.cropType || scheduleData.cropName || scheduleData.title || 'Crop';
      const activityType = scheduleData.activityType || scheduleData.type || scheduleData.taskType || scheduleData.category || 'planting';
      
      // Create notification
      addCropScheduleNotification(
        cropName, 
        scheduleData.date, 
        isEditing ? 'updated' : 'scheduled',
        activityType
      );
      
      // Show appropriate message based on online status
      if (isOnline) {
        // Alert.alert(
        //   'Success', 
        //   isEditing ? 'Schedule updated successfully!' : 'Schedule saved successfully!',
        //   [{ text: 'OK' }]
        // );
      } else {
        Alert.alert(
          'Saved Offline', 
          `${isEditing ? 'Schedule updated' : 'Schedule saved'} locally. It will sync to the cloud when you're back online.`,
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Save schedule error:', error);
      Alert.alert('Error', 'Failed to save schedule. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const newSchedules = schedules.filter(s => s.id !== scheduleId);
              setSchedules(newSchedules);
              
              const success = await saveSchedule(newSchedules);
              
              if (!success) {
                setSchedules(schedules);
                Alert.alert('Error', 'Failed to delete schedule from cloud');
              } else {
                if (isOnline) {
                  Alert.alert('Success', 'Schedule deleted successfully!');
                } else {
                  Alert.alert(
                    'Deleted Offline', 
                    'Schedule deleted locally. It will be removed from the cloud when you\'re back online.',
                    [{ text: 'OK' }]
                  );
                }
              }
            } catch (error) {
              console.error('Delete schedule error:', error);
              setSchedules(schedules);
              Alert.alert('Error', 'Failed to delete schedule');
            }
          }
        }
      ]
    );
  };

  const getAllSchedulesSorted = () => {
    return schedules.sort((a, b) => {
      try {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateA - dateB;
      } catch (error) {
        return 0;
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Offline Banner - positioned below StatusBar */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineText}>You are offline - working with local data</Text>
        </View>
      )}
      
      <ScheduleHeader onBackPress={handleBackPress} />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={activeTab === 'calendar' ? '#ffffff' : '#0B8457'} 
          />
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
            Calendar
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={activeTab === 'list' ? '#ffffff' : '#0B8457'} 
          />
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
            List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {activeTab === 'calendar' ? (
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            schedules={schedules}
          />
        ) : (
          <SchedulesListView
            schedules={getAllSchedulesSorted()}
            onEditSchedule={handleEditSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            selectedDate={selectedDate}
            onAddSchedule={handleAddSchedule}
            showDateHeader={false}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddSchedule}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Schedule Modal - pass crops and isSaving state */}
      <ScheduleModal
        visible={isModalVisible}
        onClose={() => {
          if (!isSaving) {
            setIsModalVisible(false);
            setSelectedSchedule(null);
          }
        }}
        onSave={handleSaveSchedule}
        initialData={selectedSchedule}
        selectedDate={selectedDate}
        isSaving={isSaving}
        crops={crops} // Pass crops to modal for selection
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  offlineBanner: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: StatusBar.currentHeight || 0, // Account for translucent status bar
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#0B8457',
    shadowColor: '#0B8457',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B8457',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0B8457',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
});

export default ScheduleScreen;