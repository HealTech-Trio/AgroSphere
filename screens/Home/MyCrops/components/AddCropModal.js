// screens/MyCrops/components/AddCropModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, firestore } from '../../../../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CROP_TYPES, getAllCropExamples } from '../utils/constants';

const FARM_STORAGE_KEY = '@user_farms';

const AddCropModal = ({ visible, onClose, onSave, editCrop, existingCrops = [] }) => {
  const isEditing = !!editCrop;
  
  // Step management - Start at step 3 if editing
  const [currentStep, setCurrentStep] = useState(isEditing ? 3 : 1);
  
  // Form data - Pre-fill with editCrop data if available
  const [formData, setFormData] = useState({
    farmId: editCrop?.farmId || '',
    farmName: editCrop?.farmName || '',
    cropType: editCrop?.cropType || '',
    cropTypeName: editCrop?.cropTypeName || '',
    cropName: editCrop?.cropName || '',
    area: editCrop?.area || '',
    growthStage: editCrop?.growthStage || 0,
  });

  // Data states
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState({});

  // Load farms on mount
  useEffect(() => {
    loadFarms();
  }, []);

  // Reset form when modal opens/closes OR when editCrop changes
  useEffect(() => {
    if (visible) {
      if (isEditing) {
        // Pre-fill form with editCrop data
        setFormData({
          farmId: editCrop.farmId || '',
          farmName: editCrop.farmName || '',
          cropType: editCrop.cropType || '',
          cropTypeName: editCrop.cropTypeName || '',
          cropName: editCrop.cropName || '',
          area: editCrop.area || '',
          growthStage: editCrop.growthStage || 0,
        });
        
        // Find and set the selected farm
        const farm = farms.find(f => f.id === editCrop.farmId);
        if (farm) {
          setSelectedFarm(farm);
        }
        
        setCurrentStep(3); // Go directly to details for editing
      } else {
        resetForm();
      }
    }
  }, [visible, editCrop, farms]);

  const loadFarms = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Try to load from Firestore
      const farmsQuery = query(collection(firestore, 'users', user.uid, 'farms'));
      const unsubscribe = onSnapshot(farmsQuery, (snapshot) => {
        const farmsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFarms(farmsData);
        saveFarmsToStorage(farmsData);

        // If editing, set selected farm after farms load
        if (isEditing && editCrop?.farmId) {
          const farm = farmsData.find(f => f.id === editCrop.farmId);
          if (farm) {
            setSelectedFarm(farm);
          }
        }
      }, async (error) => {
        // If Firestore fails, load from storage
        const storedFarms = await AsyncStorage.getItem(FARM_STORAGE_KEY);
        if (storedFarms) {
          const farmsData = JSON.parse(storedFarms);
          setFarms(farmsData);

          // If editing, set selected farm after farms load
          if (isEditing && editCrop?.farmId) {
            const farm = farmsData.find(f => f.id === editCrop.farmId);
            if (farm) {
              setSelectedFarm(farm);
            }
          }
        }
      });

      return () => unsubscribe();
    } catch (error) {
      // Fallback to local storage
      const storedFarms = await AsyncStorage.getItem(FARM_STORAGE_KEY);
      if (storedFarms) {
        const farmsData = JSON.parse(storedFarms);
        setFarms(farmsData);

        // If editing, set selected farm after farms load
        if (isEditing && editCrop?.farmId) {
          const farm = farmsData.find(f => f.id === editCrop.farmId);
          if (farm) {
            setSelectedFarm(farm);
          }
        }
      }
    }
  };

  const saveFarmsToStorage = async (farmsData) => {
    try {
      await AsyncStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farmsData));
    } catch (error) {
      console.error('Error saving farms to storage:', error);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      farmId: '',
      farmName: '',
      cropType: '',
      cropTypeName: '',
      cropName: '',
      area: '',
      growthStage: 0,
    });
    setSelectedFarm(null);
    setSearchQuery('');
    setErrors({});
  };

  const calculateUsedArea = (farmId) => {
    return existingCrops
      .filter(crop => crop.farmId === farmId && crop.id !== (editCrop?.id)) // Exclude current crop when editing
      .reduce((total, crop) => total + (parseFloat(crop.area) || 0), 0);
  };

  const calculateAvailableArea = (farm) => {
    const sizeMatch = farm.size?.match(/(\d+\.?\d*)/);
    const totalSize = sizeMatch ? parseFloat(sizeMatch[1]) : 0;
    const usedArea = calculateUsedArea(farm.id);
    return totalSize - usedArea;
  };

  // STEP 1: Farm Selection
  const handleFarmSelect = (farm) => {
    const available = calculateAvailableArea(farm);
    
    if (available <= 0 && !isEditing) {
      Alert.alert('Farm Full', 'This farm has no available space for new crops.');
      return;
    }

    setSelectedFarm(farm);
    setFormData(prev => ({
      ...prev,
      farmId: farm.id,
      farmName: farm.name
    }));
    setCurrentStep(2);
  };

  // STEP 2: Crop Type Selection
  const handleCropTypeSelect = (cropType) => {
    setFormData(prev => ({
      ...prev,
      cropType: cropType.id,
      cropTypeName: cropType.name
    }));
    setCurrentStep(3);
  };

  // STEP 3: Crop Details & Save
  const validateCropDetails = () => {
    const newErrors = {};
    
    if (!formData.cropName.trim()) {
      newErrors.cropName = 'Crop name is required';
    }
    
    if (!formData.area || parseFloat(formData.area) <= 0) {
      newErrors.area = 'Please enter a valid area';
    } else {
      const requestedArea = parseFloat(formData.area);
      const available = calculateAvailableArea(selectedFarm);
      
      if (isEditing) {
        // For editing, add back the current crop's area to available
        const currentCropArea = parseFloat(editCrop.area) || 0;
        const totalAvailable = available + currentCropArea;
        if (requestedArea > totalAvailable) {
          newErrors.area = `Maximum available area: ${totalAvailable.toFixed(2)} hectares`;
        }
      } else {
        if (requestedArea > available) {
          newErrors.area = `Maximum available area: ${available.toFixed(2)} hectares`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateCropDetails()) return;

    const cropData = {
      ...formData,
      area: parseFloat(formData.area).toString(),
      // Ensure farm data is included
      farmId: selectedFarm?.id || formData.farmId,
      farmName: selectedFarm?.name || formData.farmName
    };

    onSave(cropData);
    handleClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    } else {
      handleClose();
    }
  };

  // Filter crop types based on search
  const filteredCropTypes = Object.values(CROP_TYPES).filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.examples.some(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get current crop type for display
  const getCurrentCropType = () => {
    return Object.values(CROP_TYPES).find(type => type.id === formData.cropType);
  };

  // Render Step 1: Farm Selection
  const renderFarmSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        {isEditing ? 'Change Farm' : 'Select Farm'}
      </Text>
      <Text style={styles.stepDescription}>
        {isEditing ? 
          `Currently: ${editCrop.farmName}` : 
          'Choose which farm to add your crop to'
        }
      </Text>

      {farms.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={48} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>No Farms Available</Text>
          <Text style={styles.emptyText}>
            Please add a farm in Settings before adding crops
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.farmList} showsVerticalScrollIndicator={false}>
          {farms.map((farm) => {
            const sizeMatch = farm.size?.match(/(\d+\.?\d*)/);
            const totalSize = sizeMatch ? parseFloat(sizeMatch[1]) : 0;
            const usedArea = calculateUsedArea(farm.id);
            const availableArea = totalSize - usedArea;
            const usagePercent = totalSize > 0 ? (usedArea / totalSize) * 100 : 0;

            const isCurrentFarm = isEditing && farm.id === editCrop.farmId;

            return (
              <TouchableOpacity
                key={farm.id}
                style={[
                  styles.farmCard,
                  availableArea <= 0 && !isEditing && styles.farmCardDisabled,
                  isCurrentFarm && styles.currentFarmCard
                ]}
                onPress={() => handleFarmSelect(farm)}
                disabled={availableArea <= 0 && !isEditing}
              >
                <View style={styles.farmCardHeader}>
                  <View style={styles.farmCardTitle}>
                    <Ionicons 
                      name="business" 
                      size={20} 
                      color={isCurrentFarm ? "#0B8457" : "#0B8457"} 
                    />
                    <Text style={styles.farmName}>{farm.name}</Text>
                    {isCurrentFarm && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  {availableArea <= 0 && !isEditing && (
                    <View style={styles.fullBadge}>
                      <Text style={styles.fullBadgeText}>FULL</Text>
                    </View>
                  )}
                </View>

                <View style={styles.farmCardDetails}>
                  <View style={styles.farmDetailRow}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={styles.farmDetailText}>{farm.location || 'No location'}</Text>
                  </View>
                  <View style={styles.farmDetailRow}>
                    <Ionicons name="leaf" size={14} color="#666" />
                    <Text style={styles.farmDetailText}>{farm.cropType || 'No crop type'}</Text>
                  </View>
                </View>

                <View style={styles.areaInfo}>
                  <View style={styles.areaRow}>
                    <Text style={styles.areaLabel}>Total:</Text>
                    <Text style={styles.areaValue}>{totalSize.toFixed(2)} ha</Text>
                  </View>
                  <View style={styles.areaRow}>
                    <Text style={styles.areaLabel}>Used:</Text>
                    <Text style={styles.areaValue}>{usedArea.toFixed(2)} ha</Text>
                  </View>
                  <View style={styles.areaRow}>
                    <Text style={styles.areaLabel}>Available:</Text>
                    <Text style={[styles.areaValue, styles.availableArea]}>
                      {availableArea.toFixed(2)} ha
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${Math.min(usagePercent, 100)}%`,
                          backgroundColor: usagePercent >= 100 ? '#EF4444' : 
                                         usagePercent >= 80 ? '#F59E0B' : '#0B8457'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {usagePercent.toFixed(0)}% used
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  // Render Step 2: Crop Type Selection
  const renderCropTypeSelection = () => {
    const currentCropType = getCurrentCropType();

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>
          {isEditing ? 'Change Crop Type' : 'Select Crop Type'}
        </Text>
        <Text style={styles.stepDescription}>
          Selected Farm: <Text style={styles.highlight}>{selectedFarm?.name}</Text>
          {isEditing && currentCropType && (
            <Text>
              {' • '}Current: <Text style={styles.highlight}>{currentCropType.name}</Text>
            </Text>
          )}
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9B9B9B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop types..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9B9B9B"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9B9B9B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Current Crop Type Display (for editing) */}
        {isEditing && currentCropType && (
          <View style={styles.currentCropTypeContainer}>
            <Text style={styles.currentCropTypeLabel}>Current Crop Type:</Text>
            <View style={styles.currentCropTypeCard}>
              {currentCropType.image ? (
                <Image 
                  source={currentCropType.image} 
                  style={styles.cropTypeImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.cropTypeIconContainer, { backgroundColor: currentCropType.color + '20' }]}>
                  <MaterialCommunityIcons name={currentCropType.icon} size={24} color={currentCropType.color} />
                </View>
              )}
              <View style={styles.currentCropTypeInfo}>
                <Text style={styles.currentCropTypeName}>{currentCropType.name}</Text>
                <Text style={styles.currentCropTypeDescription}>{currentCropType.description}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Crop Types Vertical List */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.cropTypeList}
        >
          <View style={styles.cropTypeListContent}>
            {filteredCropTypes.map((type) => {
              const isCurrentType = isEditing && type.id === formData.cropType;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.cropTypeCardVertical,
                    isCurrentType && styles.currentCropTypeCardHighlight
                  ]}
                  onPress={() => handleCropTypeSelect(type)}
                >
                  {type.image ? (
                    <Image 
                      source={type.image} 
                      style={styles.cropTypeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.cropTypeIconContainer, { backgroundColor: type.color + '20' }]}>
                      <MaterialCommunityIcons name={type.icon} size={32} color={type.color} />
                    </View>
                  )}
                  <View style={styles.cropTypeInfo}>
                    <Text style={styles.cropTypeName}>{type.name}</Text>
                    <Text style={styles.cropTypeDescription} numberOfLines={2}>
                      {type.description}
                    </Text>
                  </View>
                  {isCurrentType && (
                    <View style={styles.currentTypeBadge}>
                      <Text style={styles.currentTypeBadgeText}>CURRENT</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {filteredCropTypes.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={48} color="#E0E0E0" />
            <Text style={styles.noResultsText}>No crop types found</Text>
          </View>
        )}
      </View>
    );
  };

  // Render Step 3: Crop Details
  const renderCropDetails = () => {
    const availableArea = selectedFarm ? calculateAvailableArea(selectedFarm) : 0;
    const currentCropArea = isEditing ? (parseFloat(editCrop.area) || 0) : 0;
    const maxArea = isEditing ? availableArea + currentCropArea : availableArea;
    const currentCropType = getCurrentCropType();

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>
          {isEditing ? 'Edit Crop Details' : 'Crop Details'}
        </Text>
        <Text style={styles.stepDescription}>
          {selectedFarm?.name} • {currentCropType?.name || formData.cropTypeName}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.detailsScroll}>
          {/* Crop Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Crop Name *</Text>
            <TextInput
              style={[styles.input, errors.cropName && styles.inputError]}
              value={formData.cropName}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, cropName: text }));
                if (errors.cropName) setErrors(prev => ({ ...prev, cropName: '' }));
              }}
              placeholder="e.g., Winter Wheat 2024"
              placeholderTextColor="#9B9B9B"
            />
            {errors.cropName && <Text style={styles.errorText}>{errors.cropName}</Text>}
          </View>

          {/* Area */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area (hectares) *</Text>
            <View style={styles.areaInputContainer}>
              <TextInput
                style={[styles.input, errors.area && styles.inputError]}
                value={formData.area}
                onChangeText={(text) => {
                  // Only allow numbers and decimal point
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  setFormData(prev => ({ ...prev, area: cleaned }));
                  if (errors.area) setErrors(prev => ({ ...prev, area: '' }));
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#9B9B9B"
              />
              <Text style={styles.areaUnit}>ha</Text>
            </View>
            <Text style={styles.helperText}>
              Available: {maxArea.toFixed(2)} hectares
              {isEditing && (
                <Text style={styles.helperNote}>
                  {' '}(including current crop area)
                </Text>
              )}
            </Text>
            {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}
          </View>

          {/* Growth Stage */}
          <View style={styles.inputGroup}>
            <View style={styles.growthHeader}>
              <Text style={styles.label}>Growth Stage</Text>
              <Text style={[styles.growthValue, { color: getProgressColor(formData.growthStage) }]}>
                {formData.growthStage}%
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${formData.growthStage}%`,
                      backgroundColor: getProgressColor(formData.growthStage)
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.percentageButtons}>
              {[0, 25, 50, 75, 100].map((percentage) => (
                <TouchableOpacity
                  key={percentage}
                  style={[
                    styles.percentageButton,
                    formData.growthStage === percentage && styles.percentageButtonSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, growthStage: percentage }))}
                >
                  <Text style={[
                    styles.percentageButtonText,
                    formData.growthStage === percentage && styles.percentageButtonTextSelected
                  ]}>
                    {percentage}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const getProgressColor = (percentage) => {
    if (percentage < 20) return '#EF4444';
    if (percentage < 50) return '#F59E0B';
    return '#10B981';
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet" 
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name={currentStep === 1 ? "close" : "arrow-back"} size={24} color="#2E2E2E" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Update Crop' : 'Add New Crop'}
            </Text>
            {!isEditing && (
              <Text style={styles.stepIndicator}>Step {currentStep} of 3</Text>
            )}
          </View>
          {currentStep === 3 && (
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          )}
          {currentStep !== 3 && <View style={styles.placeholder} />}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {currentStep === 1 && renderFarmSelection()}
          {currentStep === 2 && renderCropTypeSelection()}
          {currentStep === 3 && renderCropDetails()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 4,
    width: 60,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  stepIndicator: {
    fontSize: 12,
    color: '#9B9B9B',
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0B8457',
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#7B7B7B',
    marginBottom: 20,
  },
  highlight: {
    color: '#0B8457',
    fontWeight: '600',
  },
  
  // Farm Selection Styles
  farmList: {
    flex: 1,
  },
  farmCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  farmCardDisabled: {
    opacity: 0.6,
  },
  farmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  farmName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginLeft: 8,
  },
  fullBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fullBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  farmCardDetails: {
    gap: 6,
    marginBottom: 12,
  },
  farmDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farmDetailText: {
    fontSize: 13,
    color: '#666',
  },
  areaInfo: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  areaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  areaLabel: {
    fontSize: 13,
    color: '#666',
  },
  areaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2332',
  },
  availableArea: {
    color: '#0B8457',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#9B9B9B',
    textAlign: 'right',
  },
  
  // Crop Type Selection Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1A2332',
  },
  cropTypeList: {
    flex: 1,
  },
  cropTypeListContent: {
    paddingBottom: 20,
  },
  cropTypeCardVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cropTypeImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  cropTypeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropTypeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  cropTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  cropTypeDescription: {
    fontSize: 13,
    color: '#9B9B9B',
    lineHeight: 16,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: '#9B9B9B',
    marginTop: 12,
  },
  
  // Crop Details Styles
  detailsScroll: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2332',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A2332',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#9B9B9B',
    marginTop: 4,
  },
  areaInputContainer: {
    position: 'relative',
  },
  areaUnit: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 16,
    color: '#9B9B9B',
    fontWeight: '600',
  },
  growthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  growthValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  percentageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  percentageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  percentageButtonSelected: {
    backgroundColor: '#0B8457',
    borderColor: '#0B8457',
  },
  percentageButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  percentageButtonTextSelected: {
    color: 'white',
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7B7B7B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 20,
  },
    currentFarmCard: {
    borderColor: '#0B8457',
    borderWidth: 2,
  },
  currentBadge: {
    backgroundColor: '#0B8457',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  currentCropTypeContainer: {
    marginBottom: 16,
  },
  currentCropTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  currentCropTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  currentCropTypeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  currentCropTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  currentCropTypeDescription: {
    fontSize: 12,
    color: '#9B9B9B',
  },
  currentCropTypeCardHighlight: {
    borderColor: '#0B8457',
    borderWidth: 2,
  },
  currentTypeBadge: {
    backgroundColor: '#0B8457',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentTypeBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
  },
  helperNote: {
    color: '#666',
    fontStyle: 'italic',
  },
});

export default AddCropModal;