// screens/Analysis/SoilHealth/SoilResultScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SoilResultScreen = ({
  visible,
  result,
  toolConfig,
  iotData,
  farmData,
  connectedDevice,
  onClose,
  onNewAnalysis,
  onSaveComplete,
}) => {
  const [saving, setSaving] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const historyEntry = {
        id: `soil_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        result: result,
        farm_data: farmData,
        iot_data: iotData,
        timestamp: Date.now(),
        analysis_type: 'soil',
      };

      const historyKey = '@analysis_history_soil';
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      const updatedHistory = [historyEntry, ...history];
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      if (onSaveComplete) {
        onSaveComplete(historyEntry);
      }

      Alert.alert(
        'Saved Successfully',
        'Soil assessment has been saved to your history.',
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
      console.error('Error saving result:', error);
      Alert.alert('Error', 'Failed to save result. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#0B8457';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FF9800';
    if (score >= 20) return '#FF5722';
    return '#F44336';
  };

  const getSeverityColor = (severity) => {
    const severityLower = severity?.toLowerCase() || '';
    if (severityLower.includes('critical') || severityLower.includes('severe')) return '#F44336';
    if (severityLower.includes('moderate') || severityLower.includes('warning')) return '#FF9800';
    return '#0B8457';
  };

  if (!visible || !result) return null;

  const healthScore = result.health_score || 0;
  const healthColor = getHealthColor(healthScore);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Soil Health Report</Text>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={saving}
            >
              <Ionicons name={saving ? "hourglass" : "save"} size={24} color={toolConfig.color} />
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
                    {Math.round(healthScore)}
                  </Text>
                  <Text style={styles.scoreLabel}>Health Score</Text>
                </View>
              </View>
              <Text style={styles.scoreTitle}>{result.condition || 'Soil Assessment'}</Text>
              {result.description && (
                <Text style={styles.scoreDescription}>{result.description}</Text>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Farm Information */}
          {farmData && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="barn" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Farm Information</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Farm Name:</Text>
                  <Text style={styles.infoValue}>{farmData.name}</Text>
                </View>
                {farmData.location && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location:</Text>
                    <Text style={styles.infoValue}>{farmData.location}</Text>
                  </View>
                )}
                {farmData.size && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Size:</Text>
                    <Text style={styles.infoValue}>{farmData.size}</Text>
                  </View>
                )}
                {farmData.soilType && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Soil Type:</Text>
                    <Text style={styles.infoValue}>{farmData.soilType}</Text>
                  </View>
                )}
                {farmData.cropType && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Crop Type:</Text>
                    <Text style={styles.infoValue}>{farmData.cropType}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Environmental Conditions */}
          {iotData && (
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
                      {iotData.soil_moisture || iotData.soil}%
                    </Text>
                    <Text style={styles.environmentalLabel}>Soil Moisture</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Nutrient Levels */}
          {result.nutrients && result.nutrients.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="flask" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Nutrient Analysis</Text>
              </View>
              <View style={styles.card}>
                {result.nutrients.map((nutrient, index) => (
                  <View key={index} style={styles.nutrientItem}>
                    <View style={styles.nutrientHeader}>
                      <Text style={styles.nutrientName}>{nutrient.name}</Text>
                      <View style={[
                        styles.nutrientBadge,
                        { backgroundColor: getSeverityColor(nutrient.level) + '20' }
                      ]}>
                        <Text style={[
                          styles.nutrientLevel,
                          { color: getSeverityColor(nutrient.level) }
                        ]}>
                          {nutrient.level}
                        </Text>
                      </View>
                    </View>
                    {nutrient.description && (
                      <Text style={styles.nutrientDescription}>{nutrient.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Issues Detected */}
          {result.issues && result.issues.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle" size={20} color="#FF9800" />
                <Text style={styles.sectionTitle}>Issues Detected</Text>
              </View>
              <View style={styles.card}>
                {result.issues.map((issue, index) => (
                  <View key={index} style={styles.issueItem}>
                    <View style={styles.issueHeader}>
                      <Ionicons name="warning" size={16} color="#FF9800" />
                      <Text style={styles.issueText}>{issue}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="lightbulb-on" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Recommendations</Text>
              </View>
              <View style={styles.card}>
                {result.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationNumber}>
                      <Text style={styles.recommendationNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.recommendationContent}>
                      {rec.title && (
                        <Text style={styles.recommendationTitle}>{rec.title}</Text>
                      )}
                      <Text style={styles.recommendationText}>
                        {rec.description || rec}
                      </Text>
                      {rec.priority && (
                        <View style={[
                          styles.priorityBadge,
                          { backgroundColor: getSeverityColor(rec.priority) + '20' }
                        ]}>
                          <Text style={[
                            styles.priorityText,
                            { color: getSeverityColor(rec.priority) }
                          ]}>
                            {rec.priority} Priority
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Environmental Impact */}
          {result.environmental_impact && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="eco" size={20} color="#0B8457" />
                <Text style={styles.sectionTitle}>Environmental Impact</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.impactText}>{result.environmental_impact}</Text>
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
              <Ionicons name="refresh" size={20} color={toolConfig.color} />
              <Text style={[styles.actionButtonText, { color: toolConfig.color }]}>
                New Analysis
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={toolConfig.gradient}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name={saving ? "hourglass" : "save"} size={20} color="white" />
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving...' : 'Save Result'}
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
    lineHeight: 20,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1A2332',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
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
  nutrientItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutrientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  nutrientBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nutrientLevel: {
    fontSize: 12,
    fontWeight: '600',
  },
  nutrientDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  issueItem: {
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  issueText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#95A99C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  impactText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
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
    borderColor: '#95A99C',
  },
  primaryButton: {
    elevation: 2,
    shadowColor: '#95A99C',
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

export default SoilResultScreen;