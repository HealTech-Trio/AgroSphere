// screens/Analysis/DiseaseDetection/DiseaseDetectionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDevice } from '../../../context/DeviceContext';
import ScannerAnimation from '../components/ScannerAnimation';
import ImagePreviewScreen from '../components/ImagePreviewScreen';
import AnalysisResultScreen from '../components/AnalysisResultScreen';
import AnalysisLoadingScreen from '../components/AnalysisLoadingScreen';
import DiseaseHistoryTab from './DiseaseHistoryTab';
import ApiService from '../../../services/api';

const DiseaseDetectionScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('analysis');
  const [newHistoryEntry, setNewHistoryEntry] = useState(null);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const { realTimeData, connectedDevice } = useDevice();
  
  const toolConfig = {
    id: 'disease',
    title: 'Disease Detection',
    description: 'AI-powered plant health analysis',
    color: '#0B8457',
    gradient: ['#0B8457', '#66BB6A'],
    lightGradient: ['rgba(11, 132, 87, 0.6)', 'rgba(11, 132, 87, 0.27)'],
    icon: 'scan-helper',
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTakePhoto = () => {
    setShowScanner(true);
  };

  const handleCapture = async (photo) => {
    setShowScanner(false);
    setSelectedImage({ uri: photo.uri });
    setTimeout(() => {
      setShowPreview(true);
    }, 100);
  };

  const handleUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Gallery permission is needed to upload photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage({ uri: result.assets[0].uri });
      setShowPreview(true);
    }
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
    if (!selectedImage) {
      Alert.alert('No Image', 'Please capture or upload an image first.');
      return;
    }

    setShowPreview(false);
    setTimeout(() => {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisResult(null);
    }, 100);

    try {
      // Simulate progress
      await simulateProgress();

      // Prepare IoT data if available
      let iotDataPayload = null;
      if (realTimeData && connectedDevice) {
        iotDataPayload = {
          device_id: connectedDevice.id,
          temperature: realTimeData.temperature,
          humidity: realTimeData.humidity,
          soil_moisture: realTimeData.soil,
          timestamp: realTimeData.timestamp || Date.now(),
        };
      }

      console.log('Sending disease detection request...');
      console.log('Image URI:', selectedImage.uri);
      console.log('IoT Data:', iotDataPayload ? 'Present' : 'Not available');

      // Use ApiService instead of direct fetch
      const response = await ApiService.detectDisease(
        selectedImage.uri,
        iotDataPayload
      );

      console.log('Disease detection response:', response);

      // Check if response was successful
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
        throw new Error(response.message || response.error || 'Analysis failed');
      }
    } catch (error) {
      setIsAnalyzing(false);
      
      // Provide user-friendly error messages
      let errorMessage = 'Unable to complete analysis. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to the AI service. Please check your internet connection and ensure the backend server is running.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The request took too long. Please try with a smaller image.';
        } else if (error.message.includes('image')) {
          errorMessage = 'There was an issue processing the image. Please try a different photo.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        'Analysis Failed',
        errorMessage,
        [
          {
            text: 'Check Connection',
            onPress: async () => {
              try {
                const isConnected = await ApiService.testConnection();
                Alert.alert(
                  'Connection Status',
                  isConnected 
                    ? 'Backend server is reachable!' 
                    : 'Cannot reach backend server. Please check if it\'s running.',
                  [{ text: 'OK' }]
                );
              } catch (e) {
                Alert.alert('Connection Test Failed', 'Unable to test connection.', [{ text: 'OK' }]);
              }
            }
          },
          { text: 'OK' }
        ]
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
    setSelectedImage(null);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setShowResult(false);
  };

  const handleRetakePhoto = () => {
    setShowPreview(false);
    setSelectedImage(null);
    setTimeout(() => {
      setShowScanner(true);
    }, 100);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedImage(null);
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
            <MaterialCommunityIcons 
              name="virus" 
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
            name="microscope" 
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
          {connectedDevice && realTimeData && (
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
                    <Text style={styles.iotLabel}>Soil</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Image Selection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Image Source</Text>
            
            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons name="information-circle" size={20} color="#FFA500" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Analysis Tips</Text>
                <Text style={styles.infoText}>
                  • Ensure good lighting on the plant{'\n'}
                  • Capture clear images of affected areas{'\n'}
                  • Include IoT data for better accuracy
                </Text>
              </View>
            </View>
          
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[`${toolConfig.color}15`, `${toolConfig.color}18`]}
                  style={styles.optionGradient}
                >
                  <View style={[styles.optionIcon, { backgroundColor: `${toolConfig.color}20` }]}>
                    <MaterialCommunityIcons 
                      name="camera" 
                      size={32} 
                      color={toolConfig.color} 
                    />
                  </View>
                  <Text style={styles.optionTitle}>Scan with Camera</Text>
                  <Text style={styles.optionDescription}>
                    AI-powered real-time scanning
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionCard}
                onPress={handleUploadPhoto}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(91, 159, 255, 0.15)', 'rgba(91, 159, 255, 0.05)']}
                  style={styles.optionGradient}
                >
                  <View style={[styles.optionIcon, { backgroundColor: 'rgba(91, 159, 255, 0.2)' }]}>
                    <MaterialCommunityIcons 
                      name="image-plus" 
                      size={32} 
                      color="#5B9FFF" 
                    />
                  </View>
                  <Text style={styles.optionTitle}>Upload Photo</Text>
                  <Text style={styles.optionDescription}>
                    Select from gallery
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Tip Card */}
          <View style={styles.recentCard}>
            <LinearGradient
              colors={['rgba(91, 159, 255, 0.08)', 'rgba(91, 159, 255, 0.02)']}
              style={styles.recentGradient}
            >
              <View style={styles.recentHeader}>
                <MaterialCommunityIcons name="history" size={20} color="#5B9FFF" />
                <Text style={styles.recentTitle}>Quick Tip</Text>
              </View>
              <Text style={styles.recentText}>
                Your analysis history is saved automatically and can be accessed from the History tab. 
                Each analysis includes AI confidence scores and treatment recommendations.
              </Text>
            </LinearGradient>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <DiseaseHistoryTab 
          toolConfig={toolConfig}
          newEntry={newHistoryEntry}
        />
      )}

      {/* Modals */}
      <ScannerAnimation
        visible={showScanner}
        onCapture={handleCapture}
        onClose={() => setShowScanner(false)}
        toolColor={toolConfig.color}
      />

      <ImagePreviewScreen
        visible={showPreview}
        image={selectedImage?.uri}
        toolConfig={toolConfig}
        onConfirm={handleAnalyze}
        onRetake={handleRetakePhoto}
        onClose={handleClosePreview}
      />

      <AnalysisLoadingScreen
        visible={isAnalyzing}
        progress={analysisProgress}
        toolConfig={toolConfig}
        onCancel={handleCancelAnalysis}
      />

      <AnalysisResultScreen
        visible={showResult && analysisResult !== null}
        result={analysisResult}
        image={selectedImage?.uri}
        toolConfig={toolConfig}
        iotData={realTimeData}
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
    backgroundColor: 'transparent',
    
  },
  header: {
    paddingBottom: 10,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: -80,
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
  headerIcon: {
  },
  headerIconContainer: {
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 30,
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
  activeTab: {
    // Active tab styling handled by indicator
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
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  optionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2332',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 140, 0, 0.08)',
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
  recentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
        backgroundColor:'aliceblue',

  },
  recentGradient: {
    padding: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  recentText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default DiseaseDetectionScreen;