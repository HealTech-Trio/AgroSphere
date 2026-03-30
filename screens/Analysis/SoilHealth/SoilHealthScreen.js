// screens/Analysis/SoilHealth/SoilHealthScreen.js
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
import SoilResultScreen from './SoilResultScreen';
import SoilHistoryTab from './SoilHistoryTab';

const SoilHealthScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('analysis');
  const [newHistoryEntry, setNewHistoryEntry] = useState(null);
  
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  const { realTimeData, connectedDevice, connectionStatus } = useDevice();
  
  const toolConfig = {
    id: 'soil',
    title: 'Soil Health Assessment',
    description: 'Comprehensive soil analysis',
    color: '#95A99C',
    gradient: ['#95A99C', '#A8B5AC'],
    lightGradient: ['rgba(149, 169, 156, 0.6)', 'rgba(149, 169, 156, 0.27)'],
    icon: 'layers',
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      setLoadingFarms(true);
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert('Error', 'Please login to access your farms');
        setLoadingFarms(false);
        return;
      }

      // Try to load from Firestore first
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
        // Fallback to AsyncStorage
        const storedFarms = await AsyncStorage.getItem('@user_farms');
        if (storedFarms) {
          setFarms(JSON.parse(storedFarms));
        }
      }
    } catch (error) {
      // Try AsyncStorage as fallback
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
    // Validate IoT connection
    if (!connectedDevice || connectionStatus !== 'connected') {
      // Alert.alert(
      //   'IoT Device Required',
      //   'Please connect to your IoT device before analyzing soil health. Go to the IoT screen to connect.',
      //   [
      //     { text: 'Cancel', style: 'cancel' },
      //     { 
      //       text: 'Go to IoT', 
      //       onPress: () => navigation.navigate('Profile', {screen: 'DeviceManagement'}) 
      //     },
      //   ]
      // );
      return;
    }

    // Validate real-time data
    if (!realTimeData) {
      Alert.alert(
        'No Sensor Data',
        'Unable to read data from your IoT device. Please ensure the device is functioning properly.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate farm selection
    if (!selectedFarm) {
      Alert.alert(
        'Farm Required',
        'Please select a farm to analyze its soil health.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResult(null);

    try {
      await simulateProgress();

      // Prepare IoT data
      const iotData = {
        device_id: connectedDevice.id,
        temperature: realTimeData.temperature,
        humidity: realTimeData.humidity,
        soil_moisture: realTimeData.soil,
        timestamp: realTimeData.timestamp || Date.now(),
      };

      // Prepare farm data
      const farmData = {
        farm_id: selectedFarm.id,
        farm_name: selectedFarm.name,
        location: selectedFarm.location,
        size: selectedFarm.size,
        soil_type: selectedFarm.soilType,
        crop_type: selectedFarm.cropType,
      };

      // Call API
      const response = await ApiService.assessSoilHealth(iotData, farmData);

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
        error.message || 'Unable to complete soil assessment. Please try again.',
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
              name="layers" 
              size={54} 
              color={toolConfig.color}
              style={styles.headerIcon}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
          onPress={() => setActiveTab('analysis')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="test-tube" 
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

      {/* Content */}
      {activeTab === 'analysis' ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* IoT Device Status Card */}
          {isDeviceConnected && realTimeData ? (
            <View style={styles.iotCard}>
              <LinearGradient
                colors={['rgba(11, 132, 87, 0.08)', 'rgba(11, 132, 87, 0.02)']}
                style={styles.iotGradient}
              >
                <View style={styles.iotHeader}>
                  <Ionicons name="hardware-chip" size={20} color="#0B8457" />
                  <Text style={styles.iotTitle}>IoT Data Active</Text>
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
              <Ionicons name="warning" size={24} color="#FF9800" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>IoT Device Not Connected</Text>
                <Text style={styles.warningText}>
                  Connect to your IoT device to get real-time soil data for accurate analysis.
                </Text>
                {/* <TouchableOpacity 
                  style={styles.connectButton}
                    onPress={() => navigation.navigate('Profile', { screen: 'DeviceManagement'})}                >
                  <Text style={styles.connectButtonText}>Connect Device</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity> */}
              </View>
            </View>
          )}

          {/* Farm Selection Section */}
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
                  Add your farms in the Profile section to start analyzing soil health.
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

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={20} color="#5B9FFF" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Assessment Process</Text>
              <Text style={styles.infoText}>
                • Real-time IoT sensor data is required{'\n'}
                • Farm location and soil type enhance accuracy{'\n'}
                • Results include actionable recommendations
              </Text>
            </View>
          </View>

          {/* Analyze Button */}
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!isDeviceConnected || !selectedFarm) && styles.analyzeButtonDisabled
            ]}
            onPress={handleAnalyze}
            disabled={!isDeviceConnected || !selectedFarm}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={
                isDeviceConnected && selectedFarm
                  ? toolConfig.gradient
                  : ['#E0E0E0', '#D0D0D0']
              }
              style={styles.analyzeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons 
                name="test-tube" 
                size={24} 
                color="white" 
              />
              <Text style={styles.analyzeButtonText}>
                Analyze Soil Health
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Requirements Status */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Requirements Status</Text>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={isDeviceConnected ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={isDeviceConnected ? "#0B8457" : "#F44336"} 
              />
              <Text style={styles.requirementText}>IoT Device Connected</Text>
            </View>
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
                name={farms.length > 0 ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={farms.length > 0 ? "#0B8457" : "#F44336"} 
              />
              <Text style={styles.requirementText}>Farms Available</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <SoilHistoryTab 
          toolConfig={toolConfig}
          newEntry={newHistoryEntry}
        />
      )}

      {/* Modals */}
      <AnalysisLoadingScreen
        visible={isAnalyzing}
        progress={analysisProgress}
        toolConfig={toolConfig}
        onCancel={handleCancelAnalysis}
      />

      <SoilResultScreen
        visible={showResult && analysisResult !== null}
        result={analysisResult}
        toolConfig={toolConfig}
        iotData={realTimeData}
        farmData={selectedFarm}
        connectedDevice={connectedDevice}
        onClose={handleCloseResult}
        onNewAnalysis={handleReset}
        onSaveComplete={handleSaveComplete}
      />
    </View>
  );
};

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
    marginLeft: 10,
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
    backgroundColor: '#0B8457',
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
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
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
    marginBottom: 12,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
    backgroundColor: '#95A99C',
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
    borderColor: '#95A99C',
    backgroundColor: 'rgba(149, 169, 156, 0.05)',
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
    marginTop:9,
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

export default SoilHealthScreen;
  