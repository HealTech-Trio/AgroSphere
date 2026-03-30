// screens/Analysis/YieldPrediction/YieldPredictionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useDevice } from '../../../context/DeviceContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '../../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import ApiService from '../../../services/api';
import AnalysisLoadingScreen from '../components/AnalysisLoadingScreen';
import YieldResultScreen from './YieldResultScreen';
import YieldHistoryTab from './YieldHistoryTab';
import DateTimePicker from '@react-native-community/datetimepicker';

const YieldPredictionScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('analysis');
  const [newHistoryEntry, setNewHistoryEntry] = useState(null);
  
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [plantingDate, setPlantingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  const { realTimeData, connectedDevice, connectionStatus } = useDevice();
  
  const toolConfig = {
    id: 'yield',
    title: 'Yield Prediction',
    description: 'Forecast your harvest potential',
    color: '#5B9FFF',
    gradient: ['#5B9FFF', '#7AB0FF'],
    lightGradient: ['rgba(91, 159, 255, 0.6)', 'rgba(91, 159, 255, 0.27)'],
    icon: 'trending-up',
  };

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      loadCropsForFarm(selectedFarm.id);
    } else {
      setCrops([]);
      setSelectedCrop(null);
    }
  }, [selectedFarm]);

  const loadFarms = async () => {
    try {
      setLoadingFarms(true);
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Error', 'Please login to access your farms');
        setLoadingFarms(false);
        return;
      }

      const farmsQuery = query(
        collection(firestore, 'users', user.uid, 'farms')
      );
      const snapshot = await getDocs(farmsQuery);
      
      if (!snapshot.empty) {
        const farmsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFarms(farmsData);
      } else {
        const storedFarms = await AsyncStorage.getItem('@user_farms');
        if (storedFarms) {
          setFarms(JSON.parse(storedFarms));
        }
      }
    } catch (error) {
      try {
        const storedFarms = await AsyncStorage.getItem('@user_farms');
        if (storedFarms) {
          setFarms(JSON.parse(storedFarms));
        }
      } catch (storageError) {
      }
    } finally {
      setLoadingFarms(false);
    }
  };


  const loadCropsForFarm = async (farmId) => {
    try {
      const cropsKey = '@user_crops';  
      const storedCrops = await AsyncStorage.getItem(cropsKey);
      
      if (storedCrops) {
        const allCrops = JSON.parse(storedCrops);
        
        const farmCrops = allCrops.filter(crop => crop.farmId === farmId);
        
        if (farmCrops.length > 0) {
        } else {
        }
        
        setCrops(farmCrops);
      } else {
        setCrops([]);
      }
    } catch (error) {
      setCrops([]);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const simulateProgress = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 95) {
          clearInterval(interval);
          setAnalysisProgress(95);
          resolve();
        } else {
          setAnalysisProgress(Math.floor(progress));
        }
      }, 200);
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFarm) {
      Alert.alert(
        'Farm Required',
        'Please select a farm to predict yield.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!selectedCrop) {
      Alert.alert(
        'Crop Required',
        'Please select a crop to predict its yield.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!plantingDate) {
      Alert.alert(
        'Planting Date Required',
        'Please select the planting date.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResult(null);

    try {
      await simulateProgress();

      // Prepare IoT data (if available)
      const iotData = connectedDevice && realTimeData ? {
        device_id: connectedDevice.id,
        temperature: realTimeData.temperature,
        humidity: realTimeData.humidity,
        soil_moisture: realTimeData.soil,
        timestamp: realTimeData.timestamp || Date.now(),
      } : null;

      // Prepare farm data
      const farmData = {
        farm_id: selectedFarm.id,
        farm_name: selectedFarm.name,
        location: selectedFarm.location,
        size: selectedFarm.size,
        soil_type: selectedFarm.soilType,
      };

      // Prepare crop data with planting date
        const cropData = {
            crop_id: selectedCrop.id,
            crop_name: selectedCrop.cropName,     
            crop_type: selectedCrop.cropType,     
            growth_stage: selectedCrop.growthStage,
            area: selectedCrop.area,              
        };


      const response = await ApiService.predictYield(iotData, farmData, cropData);

      if (response.status === 'success' && response.data) {
        setAnalysisProgress(100);
        setAnalysisResult(response.data);
        
        setTimeout(() => {
          setIsAnalyzing(false);
          setTimeout(() => {
            setShowResult(true);
          }, 100);
        }, 500);
      } else {
        throw new Error(response.message || 'Analysis failed');
      }
    } catch (error) {
      setIsAnalyzing(false);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Unable to complete yield prediction. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancelAnalysis = () => {
    Alert.alert(
      'Cancel Analysis',
      'Are you sure you want to cancel the analysis?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setIsAnalyzing(false);
            setAnalysisProgress(0);
          },
        },
      ]
    );
  };

  const handleReset = () => {
    setSelectedFarm(null);
    setSelectedCrop(null);
    setPlantingDate(new Date());
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setShowResult(false);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setTimeout(() => {
      handleReset();
    }, 100);
  };

  const handleSaveComplete = (newEntry) => {
    setNewHistoryEntry(newEntry);
    setTimeout(() => setNewHistoryEntry(null), 100);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPlantingDate(selectedDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isDeviceConnected = connectedDevice && connectionStatus === 'connected';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={toolConfig.lightGradient}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{toolConfig.title}</Text>
            <Text style={styles.headerDescription}>{toolConfig.description}</Text>
          </View>

          <View style={styles.headerIconContainer}>
            <MaterialIcons 
              name="trending-up" 
              size={54} 
              color={toolConfig.color}
              style={styles.headerIcon}
            />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
          onPress={() => setActiveTab('analysis')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="chart-line" 
            size={20} 
            color={activeTab === 'analysis' ? toolConfig.color : '#9B9B9B'} 
          />
          <Text style={[
            styles.tabLabel,
            activeTab === 'analysis' && { color: toolConfig.color }
          ]}>
            Analysis
          </Text>
          {activeTab === 'analysis' && (
            <View style={[styles.tabIndicator, { backgroundColor: toolConfig.color }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="time-outline" 
            size={20} 
            color={activeTab === 'history' ? toolConfig.color : '#9B9B9B'} 
          />
          <Text style={[
            styles.tabLabel,
            activeTab === 'history' && { color: toolConfig.color }
          ]}>
            History
          </Text>
          {activeTab === 'history' && (
            <View style={[styles.tabIndicator, { backgroundColor: toolConfig.color }]} />
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'analysis' ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isDeviceConnected && realTimeData ? (
            <View style={styles.iotCard}>
              <LinearGradient
                colors={['rgba(91, 159, 255, 0.08)', 'rgba(91, 159, 255, 0.02)']}
                style={styles.iotGradient}
              >
                <View style={styles.iotHeader}>
                  <Ionicons name="hardware-chip" size={20} color="#5B9FFF" />
                  <Text style={styles.iotTitle}>IoT Data Available</Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
                <View style={styles.iotDataRow}>
                  <View style={styles.iotDataItem}>
                    <Text style={styles.iotValue}>{realTimeData.temperature?.toFixed(1) || '--'}°C</Text>
                    <Text style={styles.iotLabel}>Temp</Text>
                  </View>
                  <View style={styles.iotDataItem}>
                    <Text style={styles.iotValue}>{realTimeData.humidity?.toFixed(0) || '--'}%</Text>
                    <Text style={styles.iotLabel}>Humidity</Text>
                  </View>
                  <View style={styles.iotDataItem}>
                    <Text style={styles.iotValue}>{realTimeData.soil || '--'}%</Text>
                    <Text style={styles.iotLabel}>Soil Moisture</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.warningCard}>
              <Ionicons name="information-circle" size={24} color="#5B9FFF" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>IoT Data Optional</Text>
                <Text style={styles.warningText}>
                  IoT data improves prediction accuracy. Connect your device for better results.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Farm</Text>
            
            {loadingFarms ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={toolConfig.color} />
                <Text style={styles.loadingText}>Loading farms...</Text>
              </View>
            ) : farms.length === 0 ? (
              <View style={styles.emptyFarmsCard}>
                <MaterialCommunityIcons name="barn" size={48} color="#E0E0E0" />
                <Text style={styles.emptyFarmsTitle}>No Farms Found</Text>
                <Text style={styles.emptyFarmsText}>
                  Add your farms in the Profile section to start predicting yields.
                </Text>
                <TouchableOpacity 
                  style={styles.addFarmButton}
                  onPress={() => navigation.navigate('FarmDetails')}
                >
                  <Text style={styles.addFarmButtonText}>Add Farm</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.farmsScrollContent}
              >
                {farms.map((farm) => (
                  <TouchableOpacity
                    key={farm.id}
                    style={[
                      styles.farmCard,
                      selectedFarm?.id === farm.id && styles.farmCardSelected
                    ]}
                    onPress={() => setSelectedFarm(farm)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.farmCardHeader}>
                      <MaterialCommunityIcons 
                        name="barn" 
                        size={24} 
                        color={selectedFarm?.id === farm.id ? toolConfig.color : '#666'} 
                      />
                      {selectedFarm?.id === farm.id && (
                        <View style={[styles.selectedBadge, { backgroundColor: toolConfig.color }]}>
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.farmName,
                      selectedFarm?.id === farm.id && { color: toolConfig.color }
                    ]} numberOfLines={1}>
                      {farm.name}
                    </Text>
                    <View style={styles.farmDetails}>
                      {farm.location && (
                        <View style={styles.farmDetailItem}>
                          <Ionicons name="location" size={12} color="#9B9B9B" />
                          <Text style={styles.farmDetailText} numberOfLines={1}>
                            {farm.location}
                          </Text>
                        </View>
                      )}
                      {farm.soilType && (
                        <View style={styles.farmDetailItem}>
                          <MaterialCommunityIcons name="texture-box" size={12} color="#9B9B9B" />
                          <Text style={styles.farmDetailText} numberOfLines={1}>
                            {farm.soilType}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {selectedFarm && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Crop</Text>
              
              {crops.length === 0 ? (
                <View style={styles.emptyCropsCard}>
                  <MaterialCommunityIcons name="sprout" size={48} color="#E0E0E0" />
                  <Text style={styles.emptyCropsTitle}>No Crops Found</Text>
                  <Text style={styles.emptyCropsText}>
                    Add crops to this farm in My Crops section.
                  </Text>
                  <TouchableOpacity 
                    style={styles.addCropButton}
                    onPress={() => navigation.navigate('Home', { screen: 'MyCrops' })}
                  >
                    <Text style={styles.addCropButtonText}>Go to My Crops</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cropsScrollContent}
                >
                  {crops.map((crop) => (
                    <TouchableOpacity
                      key={crop.id}
                      style={[
                        styles.cropCard,
                        selectedCrop?.id === crop.id && styles.cropCardSelected
                      ]}
                      onPress={() => setSelectedCrop(crop)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cropCardHeader}>
                        <MaterialCommunityIcons 
                          name="leaf" 
                          size={24} 
                          color={selectedCrop?.id === crop.id ? toolConfig.color : '#666'} 
                        />
                        {selectedCrop?.id === crop.id && (
                          <View style={[styles.selectedBadge, { backgroundColor: toolConfig.color }]}>
                            <Ionicons name="checkmark" size={16} color="white" />
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.cropName,
                        selectedCrop?.id === crop.id && { color: toolConfig.color }
                      ]} numberOfLines={1}>
                        {crop.cropName}
                      </Text>
                      <View style={styles.cropDetails}>
                        <View style={styles.cropDetailItem}>
                          <MaterialCommunityIcons name="sprout" size={12} color="#9B9B9B" />
                          <Text style={styles.cropDetailText} numberOfLines={1}>
                            {crop.cropType}
                          </Text>
                        </View>
                        <View style={styles.cropDetailItem}>
                          <MaterialCommunityIcons name="chart-line" size={12} color="#9B9B9B" />
                          <Text style={styles.cropDetailText}>
                            {crop.growthStage}% Growth
                          </Text>
                        </View>
                        <View style={styles.cropDetailItem}>
                          <MaterialCommunityIcons name="texture-box" size={12} color="#9B9B9B" />
                          <Text style={styles.cropDetailText}>
                            {crop.area} ha
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {selectedCrop && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Planting Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color={toolConfig.color} />
                <Text style={styles.datePickerText}>{formatDate(plantingDate)}</Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={plantingDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={20} color="#5B9FFF" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Prediction Accuracy</Text>
              <Text style={styles.infoText}>
                • Confidence score: 0-55% (limited data){'\n'}
                • Weather forecast integration{'\n'}
                • Growth stage and health analysis{'\n'}
                • Soil and environmental factors
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!selectedFarm || !selectedCrop || !plantingDate) && styles.analyzeButtonDisabled
            ]}
            onPress={handleAnalyze}
            disabled={!selectedFarm || !selectedCrop || !plantingDate}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={
                selectedFarm && selectedCrop && plantingDate
                  ? toolConfig.gradient
                  : ['#E0E0E0', '#D0D0D0']
              }
              style={styles.analyzeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons 
                name="chart-line" 
                size={24} 
                color="white" 
              />
              <Text style={styles.analyzeButtonText}>
                Predict Yield
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Requirements Status</Text>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={selectedFarm ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={selectedFarm ? "#0B8457" : "#F44336"} 
              />
              <Text style={styles.requirementText}>Farm Selected</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={selectedCrop ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={selectedCrop ? "#0B8457" : "#F44336"} 
              />
              <Text style={styles.requirementText}>Crop Selected</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={plantingDate ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={plantingDate ? "#0B8457" : "#F44336"} 
              />
              <Text style={styles.requirementText}>Planting Date Set</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={isDeviceConnected ? "checkmark-circle" : "information-circle"} 
                size={20} 
                color={isDeviceConnected ? "#0B8457" : "#FFA500"} 
              />
              <Text style={styles.requirementText}>IoT Data (Optional)</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <YieldHistoryTab 
          toolConfig={toolConfig}
          newEntry={newHistoryEntry}
        />
      )}

      <AnalysisLoadingScreen
        visible={isAnalyzing}
        progress={analysisProgress}
        toolConfig={toolConfig}
        onCancel={handleCancelAnalysis}
      />

      <YieldResultScreen
        visible={showResult && analysisResult !== null}
        result={analysisResult}
        toolConfig={toolConfig}
        iotData={realTimeData}
        farmData={selectedFarm}
        cropData={selectedCrop}
        plantingDate={plantingDate}
        connectedDevice={connectedDevice}
        onClose={handleCloseResult}
        onNewAnalysis={handleReset}
        onSaveComplete={handleSaveComplete}
      />
    </View>
  );
};

// Styles remain the same as Irrigation screen with color changes
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingBottom: 10,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 80,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 28,
    marginLeft: 8,
    marginTop: -12,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    marginTop: -15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2332',
    letterSpacing: -0.5,
  },
  headerDescription: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  headerIconContainer: {
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 25,
    marginTop: -15,
  },
  headerIcon: {
    opacity: 0.9,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9B9B9B',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  iotCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 2,
    backgroundColor: 'aliceblue',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  iotGradient: {
    padding: 16,
  },
  iotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginLeft: 8,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B9FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  iotDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  iotDataItem: {
    alignItems: 'center',
  },
  iotValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
  },
  iotLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(91, 159, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#5B9FFF',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyFarmsCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  emptyFarmsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFarmsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addFarmButton: {
    backgroundColor: '#5B9FFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFarmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  farmsScrollContent: {
    paddingRight: 20,
  },
  farmCard: {
    width: 180,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  farmCardSelected: {
    borderColor: '#5B9FFF',
    backgroundColor: 'rgba(91, 159, 255, 0.05)',
  },
  farmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  farmDetails: {
    gap: 6,
  },
  farmDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmDetailText: {
    fontSize: 12,
    color: '#9B9B9B',
    flex: 1,
  },
  emptyCropsCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  emptyCropsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCropsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addCropButton: {
    backgroundColor: '#5B9FFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addCropButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  cropsScrollContent: {
    paddingRight: 20,
  },
  cropCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cropCardSelected: {
    borderColor: '#5B9FFF',
    backgroundColor: 'rgba(91, 159, 255, 0.05)',
  },
  cropCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  cropDetails: {
    gap: 6,
  },
  cropDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cropDetailText: {
    fontSize: 12,
    color: '#9B9B9B',
    flex: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#1A2332',
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(91, 159, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  analyzeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#5B9FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  analyzeButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  requirementsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
  },
});

export default YieldPredictionScreen;