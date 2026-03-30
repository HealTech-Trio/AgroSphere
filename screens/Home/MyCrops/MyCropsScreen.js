// screens/MyCrops/MyCropsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Components
import SearchBar from './components/SearchBar';
import FilterSortBar from './components/FilterSortBar';
import CropCard from './components/CropCard';
import AddCropModal from './components/AddCropModal';
import CropStats from './components/CropStats';
import CropSummaryModal from './components/CropSummaryModal';

// Hooks & Utils
import { useCrops } from './hooks/useCrops';
import { FILTER_OPTIONS, SORT_OPTIONS } from './utils/constants';

import { useNotifications } from '../../../context/NotificationsContext';

const MyCropsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { addNotification } = useNotifications();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTER_OPTIONS.ALL);
  const [activeSort, setActiveSort] = useState(SORT_OPTIONS.NAME);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Hooks
  const { 
    crops, 
    loading, 
    isOnline, 
    addCrop, 
    updateCrop, 
    deleteCrop, 
    syncAllCrops,
    getCropStats 
  } = useCrops();

  // Filter and sort crops
  const filteredAndSortedCrops = crops
    .filter(crop => {
      // Search filter
      const cropName = crop?.cropName || '';
      const farmName = crop?.farmName || '';
      const searchTerm = searchQuery.toLowerCase().trim();
      
      const matchesSearch = cropName.toLowerCase().includes(searchTerm) ||
                           farmName.toLowerCase().includes(searchTerm);
      
      // Filter by stage or type
      const matchesFilter = activeFilter === FILTER_OPTIONS.ALL ? true :
                           activeFilter === FILTER_OPTIONS.BY_FARM ? true :
                           activeFilter === FILTER_OPTIONS.BY_TYPE ? true :
                           activeFilter === 'early_stage' ? (crop?.growthStage || 0) < 50 :
                           activeFilter === 'late_stage' ? (crop?.growthStage || 0) >= 50 && (crop?.growthStage || 0) < 100 :
                           activeFilter === 'completed' ? (crop?.growthStage || 0) === 100 :
                           crop?.cropType === activeFilter;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (activeSort) {
        case SORT_OPTIONS.NAME:
          return (a?.cropName || '').localeCompare(b?.cropName || '');
          
        case SORT_OPTIONS.PLANT_DATE:
          const dateA = a?.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b?.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
          
        case SORT_OPTIONS.AREA:
          return (parseFloat(b?.area) || 0) - (parseFloat(a?.area) || 0);
          
        case 'lowest_area':
          return (parseFloat(a?.area) || 0) - (parseFloat(b?.area) || 0);
          
        case SORT_OPTIONS.GROWTH:
          return (b?.growthStage || 0) - (a?.growthStage || 0);
          
        default:
          return 0;
      }
    });

  // Handlers

  const handleAddCrop = async (cropData) => {
    try {
      await addCrop(cropData);
      
      addNotification(
        '🌱 Crop Added Successfully',
        `${cropData.cropName} has been added to ${cropData.farmName}`,
        'success',
        true
      );
      
      // Don't show alert if you have notifications, or keep it brief
    } catch (error) {
      Alert.alert('Error', 'Failed to add crop. Please try again.');
    }
  };

  const handleEditCrop = async (cropData) => {
    try {
      const updatedCrop = {
        ...editingCrop,
        ...cropData,
        updatedAt: new Date().toISOString()
      };

      const result = await updateCrop(editingCrop.id, updatedCrop);
      
      if (result && result.justCompleted) {
        Alert.alert(
          '🎉 Harvest Time!',
          `${updatedCrop.cropName} has reached 100% growth! It's time to schedule a harvest date.`,
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      }
      
      addNotification(
        '✏️ Crop Updated Successfully',
        `${updatedCrop.cropName} details have been updated`,
        'info',
        true
      );
      
      setEditingCrop(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update crop. Please try again.');
    }
  };

  const handleDeleteCrop = (crop) => {
    Alert.alert(
      'Delete Crop',
      `Are you sure you want to delete ${crop.cropName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCrop(crop.id);
              
              addNotification(
                '🗑️ Crop Deleted',
                `${crop.cropName} has been removed from your crops`,
                'info',
                true
              );
              
            } catch (error) {
              Alert.alert('Error', 'Failed to delete crop. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditPress = (crop) => {
    setEditingCrop(crop);
    setShowAddModal(true);
  };

  const handleCropPress = (crop) => {
    setSelectedCrop(crop);
    setShowSummaryModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingCrop(null);
  };

  const handleSaveCrop = (cropData) => {
    if (editingCrop) {
      handleEditCrop(cropData);
    } else {
      handleAddCrop(cropData);
    }
  };

  const handleSyncPress = async () => {
    const synced = await syncAllCrops();
    if (synced) {
      Alert.alert('Success', `Synced ${synced} operations`);
    }
  };

  // Render methods
  const renderCropList = () => (
    <View style={styles.listContainer}>
      <FlatList
        data={filteredAndSortedCrops}
        renderItem={({ item }) => (
          <CropCard
            crop={item}
            viewMode="list"
            onEdit={handleEditPress}
            onDelete={handleDeleteCrop}
            onPress={() => handleCropPress(item)}
          />
        )}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        key="list"
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="sprout-outline" size={64} color="#E8E8E8" />
      <Text style={styles.emptyStateTitle}>No Crops Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || activeFilter !== FILTER_OPTIONS.ALL 
          ? 'Try adjusting your search or filter'
          : 'Get started by adding your first crop'
        }
      </Text>
      {!searchQuery && activeFilter === FILTER_OPTIONS.ALL && (
        <TouchableOpacity 
          style={styles.emptyStateButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.emptyStateButtonText}>Add Your First Crop</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderContent = () => {
    if (filteredAndSortedCrops.length === 0) {
      return renderEmptyState();
    }
    
    return renderCropList();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text>You're offline. Changes will sync when you're back online.</Text>
          <TouchableOpacity onPress={handleSyncPress}>
            <Text>Sync Now</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={['rgba(11, 132, 87, 0.2)', 'transparent']}
        style={[styles.gradientOverlay, { height: insets.top + 120 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2E2E2E" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>My Crops</Text>
            <Text style={styles.subtitle}>Manage your farm crops</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.scrollView}>
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              colors={['#0B8457']}
              tintColor="#0B8457"
            />
          }
        >
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search crops by name or farm..."
          />

          {/* Crop Statistics */}
          <CropStats stats={getCropStats()} />

          {/* Filter & Sort Bar */}
          <FilterSortBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            activeSort={activeSort}
            onSortChange={setActiveSort}
            cropCount={filteredAndSortedCrops.length}
          />

          {/* Crops List */}
          {renderContent()}

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Add/Edit Modal */}
      <AddCropModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCrop(null);
        }}
        onSave={handleSaveCrop}
        editCrop={editingCrop} // This will pre-fill the form
        existingCrops={crops}
      />

      {/* Crop Summary Modal */}
      <CropSummaryModal
        visible={showSummaryModal}
        crop={selectedCrop}
        onClose={() => {
          setShowSummaryModal(false);
          setSelectedCrop(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2332',
  },
  subtitle: {
    fontSize: 14,
    color: '#7B7B7B',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B8457',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B8457',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  listContainer: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7B7B7B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#0B8457',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyCropsScreen;