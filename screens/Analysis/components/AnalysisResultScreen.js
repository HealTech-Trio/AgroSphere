// screens/Analysis/components/AnalysisResultScreen.js
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const AnalysisResultScreen = ({ 
  visible, 
  result, 
  image, 
  toolConfig, 
  iotData,
  connectedDevice,
  onClose, 
  onNewAnalysis,
  onSaveComplete 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useState(new Animated.Value(0))[0];
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Animate health progress bar
      const healthPercentage = result?.health_percentage || result?.confidence || 75;
      Animated.timing(progressAnim, {
        toValue: healthPercentage,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      progressAnim.setValue(0);
    }
  }, [visible, result]);

  const getHealthColor = (percentage) => {
    if (percentage >= 80) return '#0B8457';
    if (percentage >= 60) return '#8BC34A';
    if (percentage >= 40) return '#FF9800';
    if (percentage >= 20) return '#FF5722';
    return '#F44336';
  };

  const getHealthStatus = (percentage) => {
    if (percentage >= 80) return 'Excellent Health';
    if (percentage >= 60) return 'Good Health';
    if (percentage >= 40) return 'Fair Health';
    if (percentage >= 20) return 'Poor Health';
    return 'Critical Condition';
  };

  const getSeverityColor = (severity) => {
    const severityLower = severity?.toLowerCase() || '';
    if (severityLower.includes('severe') || severityLower.includes('high')) return '#F44336';
    if (severityLower.includes('moderate') || severityLower.includes('medium')) return '#FF9800';
    return '#0B8457';
  };

  const getSeverityIcon = (severity) => {
    const severityLower = severity?.toLowerCase() || '';
    if (severityLower.includes('severe') || severityLower.includes('high')) return 'alert-circle';
    if (severityLower.includes('moderate') || severityLower.includes('medium')) return 'warning';
    return 'checkmark-circle';
  };

  const saveToHistory = async () => {
    setIsSaving(true);
    try {
      const historyKey = `@analysis_history_${toolConfig.id}`;
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      const newEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        image: image,
        result: result,
        iot_data: iotData && connectedDevice ? {
          device_id: connectedDevice.id,
          temperature: iotData.temperature,
          humidity: iotData.humidity,
          soil_moisture: iotData.soil,
        } : null,
      };

      history.unshift(newEntry);
      
      if (history.length > 50) {
        history.splice(50);
      }

      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
      setIsSaved(true);
      
      if (onSaveComplete) {
        onSaveComplete(newEntry);
      }

      Alert.alert(
        'Saved Successfully',
        'Analysis results have been saved to your history.',
        [
          {
            text: 'View History',
            onPress: () => {
              onClose();
            },
          },
          {
            text: 'New Analysis',
            onPress: () => {
              onClose();
              if (onNewAnalysis) {
                onNewAnalysis();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving to history:', error);
      Alert.alert(
        'Error',
        'Failed to save analysis results. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!result || !visible) {
    return null;
  }

  const healthPercentage = result?.health_percentage || result?.confidence || 75;
  const healthColor = getHealthColor(healthPercentage);
  const healthStatus = getHealthStatus(healthPercentage);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const progressColor = progressAnim.interpolate({
    inputRange: [0, 20, 40, 60, 80, 100],
    outputRange: ['#F44336', '#FF5722', '#FF9800', '#8BC34A', '#0B8457', '#0B8457'],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
        
        {/* Header */}
        <LinearGradient
          colors={toolConfig.lightGradient}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Disease Analysis</Text>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={saveToHistory}
              disabled={isSaving || isSaved}
            >
              <Ionicons 
                name={isSaving ? "hourglass" : isSaved ? "checkmark-circle" : "save"} 
                size={24} 
                color={isSaved ? "#0B8457" : toolConfig.color} 
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Health Score Card */}
          <Animated.View style={[styles.scoreCard, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[`${healthColor}20`, `${healthColor}10`]}
              style={styles.scoreGradient}
            >
              <View style={styles.scoreCircle}>
                <View style={[styles.scoreCircleInner, { borderColor: healthColor }]}>
                  <Text style={[styles.scoreNumber, { color: healthColor }]}>
                    {Math.round(healthPercentage)}
                  </Text>
                  <Text style={styles.scoreLabel}>Health Score</Text>
                </View>
              </View>
              <Text style={styles.scoreTitle}>{healthStatus}</Text>

              {/* Animated Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressWidth,
                        backgroundColor: progressColor,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>Critical</Text>
                  <Text style={styles.progressLabel}>Poor</Text>
                  <Text style={styles.progressLabel}>Fair</Text>
                  <Text style={styles.progressLabel}>Good</Text>
                  <Text style={styles.progressLabel}>Excellent</Text>
                </View>
              </View>

              <Text style={styles.scoreDescription}>
                AI Confidence: {Math.round(result?.confidence || healthPercentage)}%
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Analyzed Image */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="image" size={20} color={toolConfig.color} />
              <Text style={styles.sectionTitle}>Analyzed Image</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: image }} 
                  style={styles.resultImage}
                  resizeMode="cover"
                />
                {iotData && connectedDevice && (
                  <View style={styles.iotBadge}>
                    <Ionicons name="hardware-chip" size={14} color="#0B8457" />
                    <Text style={styles.iotBadgeText}>IoT Enhanced</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Detection Result */}
          {result.disease_name && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="virus" size={20} color={getSeverityColor(result.severity)} />
                <Text style={styles.sectionTitle}>Detection Result</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.diseaseHeader}>
                  <Text style={styles.diseaseName}>{result.disease_name}</Text>
                  {result.severity && (
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(result.severity) + '20' }
                    ]}>
                      <Ionicons 
                        name={getSeverityIcon(result.severity)} 
                        size={14} 
                        color={getSeverityColor(result.severity)} 
                      />
                      <Text style={[
                        styles.severityText,
                        { color: getSeverityColor(result.severity) }
                      ]}>
                        {result.severity}
                      </Text>
                    </View>
                  )}
                </View>
                {result.description && (
                  <Text style={styles.diseaseDescription}>{result.description}</Text>
                )}
              </View>
            </View>
          )}

          {/* Environmental Data */}
          {iotData && connectedDevice && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="hardware-chip" size={20} color="#0B8457" />
                <Text style={styles.sectionTitle}>Environmental Data</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.environmentalGrid}>
                  <View style={styles.environmentalItem}>
                    <Ionicons name="thermometer" size={24} color="#FF5722" />
                    <Text style={styles.environmentalValue}>
                      {iotData.temperature?.toFixed(1)}°C
                    </Text>
                    <Text style={styles.environmentalLabel}>Temperature</Text>
                  </View>
                  <View style={styles.environmentalItem}>
                    <Ionicons name="water" size={24} color="#2196F3" />
                    <Text style={styles.environmentalValue}>
                      {iotData.humidity?.toFixed(0)}%
                    </Text>
                    <Text style={styles.environmentalLabel}>Humidity</Text>
                  </View>
                  <View style={styles.environmentalItem}>
                    <MaterialCommunityIcons name="water-percent" size={24} color="#795548" />
                    <Text style={styles.environmentalValue}>
                      {iotData.soil}%
                    </Text>
                    <Text style={styles.environmentalLabel}>Soil Moisture</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Symptoms */}
          {result.symptoms && result.symptoms.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="format-list-bulleted" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Identified Symptoms</Text>
              </View>
              <View style={styles.card}>
                {result.symptoms.map((symptom, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listBullet}>
                      <Ionicons name="alert-circle" size={16} color="#FF9800" />
                    </View>
                    <Text style={styles.listText}>{symptom}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Treatment Recommendations */}
          {result.treatments && result.treatments.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="medical-bag" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Treatment Plan</Text>
              </View>
              <View style={styles.card}>
                {result.treatments.map((treatment, index) => (
                  <View key={index} style={styles.treatmentItem}>
                    <View style={styles.treatmentHeader}>
                      <View style={styles.treatmentNumber}>
                        <Text style={styles.treatmentNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.treatmentContent}>
                        <Text style={styles.treatmentTitle}>
                          {treatment.title || treatment}
                        </Text>
                        {treatment.description && (
                          <Text style={styles.treatmentDescription}>
                            {treatment.description}
                          </Text>
                        )}
                        {treatment.application && (
                          <View style={styles.applicationInfo}>
                            <Ionicons name="time-outline" size={14} color="#666" />
                            <Text style={styles.applicationText}>
                              {treatment.application}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {index < result.treatments.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Prevention Tips */}
          {result.prevention && result.prevention.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome5 name="shield-alt" size={18} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Prevention Measures</Text>
              </View>
              <View style={styles.card}>
                {result.prevention.map((tip, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listBullet}>
                      <Ionicons name="checkmark-circle" size={16} color="#0B8457" />
                    </View>
                    <Text style={styles.listText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Environmental Factors */}
          {result.environmental_factors && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="weather-cloudy" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Environmental Analysis</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.environmentText}>{result.environmental_factors}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                onClose();
                if (onNewAnalysis) {
                  onNewAnalysis();
                }
              }}
            >
              <Ionicons name="camera" size={20} color={toolConfig.color} />
              <Text style={[styles.actionButtonText, { color: toolConfig.color }]}>
                New Scan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={saveToHistory}
              disabled={isSaving || isSaved}
            >
              <LinearGradient
                colors={isSaved ? ['#0B8457', '#66BB6A'] : toolConfig.gradient}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons 
                  name={isSaving ? "hourglass" : isSaved ? "checkmark-circle" : "save"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.primaryButtonText}>
                  {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Result'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  scoreCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scoreGradient: {
    padding: 24,
    alignItems: 'center',
  },
  scoreCircle: {
    marginBottom: 20,
  },
  scoreCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scoreTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2332',
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 12,
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9B9B9B',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  iotBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  iotBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  diseaseHeader: {
    marginBottom: 12,
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 8,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  diseaseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  environmentalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  environmentalItem: {
    alignItems: 'center',
    flex: 1,
  },
  environmentalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    marginTop: 8,
  },
  environmentalLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  listBullet: {
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  treatmentItem: {
    paddingVertical: 8,
  },
  treatmentHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  treatmentNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0B8457',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treatmentNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  treatmentContent: {
    flex: 1,
  },
  treatmentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  treatmentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  applicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applicationText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  environmentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 2,
    borderColor: '#0B8457',
  },
  primaryButton: {
    elevation: 2,
    shadowColor: '#0B8457',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AnalysisResultScreen;