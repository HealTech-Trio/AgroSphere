// screens/Analysis/IrrigationOptimization/IrrigationResultScreen.js
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

const IrrigationResultScreen = ({
  visible,
  result,
  toolConfig,
  iotData,
  farmData,
  cropData,
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
        id: `irrigation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        result: result,
        farm_data: farmData,
        crop_data: cropData,
        iot_data: iotData,
        timestamp: Date.now(),
        analysis_type: 'irrigation',
      };

      const historyKey = '@analysis_history_irrigation';
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      const updatedHistory = [historyEntry, ...history];
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      if (onSaveComplete) {
        onSaveComplete(historyEntry);
      }

      Alert.alert(
        'Saved Successfully',
        'Irrigation optimization has been saved to your history.',
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
      Alert.alert('Error', 'Failed to save result. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getEfficiencyColor = (score) => {
    if (score >= 80) return '#0B8457';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FF9800';
    if (score >= 20) return '#FF5722';
    return '#F44336';
  };

  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase() || '';
    if (priorityLower.includes('high') || priorityLower.includes('urgent')) return '#F44336';
    if (priorityLower.includes('medium') || priorityLower.includes('moderate')) return '#FF9800';
    return '#0B8457';
  };

  if (!visible || !result) return null;

  const efficiencyScore = result.efficiency_score || 0;
  const efficiencyColor = getEfficiencyColor(efficiencyScore);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Irrigation Report</Text>
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
          {/* Efficiency Score Card */}
          <Animated.View style={[styles.scoreCard, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[`${efficiencyColor}20`, `${efficiencyColor}10`]}
              style={styles.scoreGradient}
            >
              <View style={styles.scoreCircle}>
                <View style={[styles.scoreCircleInner, { borderColor: efficiencyColor }]}>
                  <Text style={[styles.scoreNumber, { color: efficiencyColor }]}>
                    {Math.round(efficiencyScore)}
                  </Text>
                  <Text style={styles.scoreLabel}>Efficiency</Text>
                </View>
              </View>
              <Text style={styles.scoreTitle}>{result.status || 'Optimization Complete'}</Text>
              {result.description && (
                <Text style={styles.scoreDescription}>{result.description}</Text>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Farm & Crop Information */}
          {(farmData || cropData) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="information" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Analysis Context</Text>
              </View>
              <View style={styles.card}>
                {farmData && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Farm:</Text>
                      <Text style={styles.infoValue}>{farmData.name}</Text>
                    </View>
                    {farmData.location && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Location:</Text>
                        <Text style={styles.infoValue}>{farmData.location}</Text>
                      </View>
                    )}
                    {farmData.soilType && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Soil Type:</Text>
                        <Text style={styles.infoValue}>{farmData.soilType}</Text>
                      </View>
                    )}
                  </>
                )}
                {cropData && (
                <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Crop:</Text>
                    <Text style={styles.infoValue}>{cropData.crop_name || cropData.cropName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type:</Text>
                    <Text style={styles.infoValue}>{cropData.crop_type || cropData.cropType}</Text>
                    </View>
                    <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Growth Stage:</Text>
                    <Text style={styles.infoValue}>{cropData.growth_stage || cropData.growthStage}%</Text>
                    </View>
                </>
                )}
              </View>
            </View>
          )}

          {/* Environmental Conditions */}
          {iotData && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="hardware-chip" size={20} color="#0B8457" />
                <Text style={styles.sectionTitle}>Current Conditions</Text>
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

          {/* Irrigation Schedule */}
          {result.irrigation_schedule && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="water-pump" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Irrigation Schedule</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.scheduleItem}>
                  <View style={styles.scheduleHeader}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={toolConfig.color} />
                    <Text style={styles.scheduleTitle}>Recommended Timing</Text>
                  </View>
                  <Text style={styles.scheduleText}>{result.irrigation_schedule.timing}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.scheduleItem}>
                  <View style={styles.scheduleHeader}>
                    <MaterialCommunityIcons name="water" size={20} color={toolConfig.color} />
                    <Text style={styles.scheduleTitle}>Water Volume</Text>
                  </View>
                  <Text style={styles.scheduleText}>{result.irrigation_schedule.volume}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.scheduleItem}>
                  <View style={styles.scheduleHeader}>
                    <MaterialCommunityIcons name="calendar-clock" size={20} color={toolConfig.color} />
                    <Text style={styles.scheduleTitle}>Frequency</Text>
                  </View>
                  <Text style={styles.scheduleText}>{result.irrigation_schedule.frequency}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Fertilizer Recommendations */}
          {result.fertilizer_plan && result.fertilizer_plan.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="flask" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Fertilizer Plan</Text>
              </View>
              <View style={styles.card}>
                {result.fertilizer_plan.map((fertilizer, index) => (
                  <View key={index}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.fertilizerItem}>
                      <View style={styles.fertilizerHeader}>
                        <Text style={styles.fertilizerName}>{fertilizer.type}</Text>
                        <View style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(fertilizer.priority) + '20' }
                        ]}>
                          <Text style={[
                            styles.priorityText,
                            { color: getPriorityColor(fertilizer.priority) }
                          ]}>
                            {fertilizer.priority}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.fertilizerDetails}>
                        <View style={styles.fertilizerDetailRow}>
                          <MaterialCommunityIcons name="weight" size={16} color="#666" />
                          <Text style={styles.fertilizerDetailText}>
                            Amount: {fertilizer.amount}
                          </Text>
                        </View>
                        <View style={styles.fertilizerDetailRow}>
                          <MaterialCommunityIcons name="calendar" size={16} color="#666" />
                          <Text style={styles.fertilizerDetailText}>
                            Timing: {fertilizer.timing}
                          </Text>
                        </View>
                      </View>
                      {fertilizer.application_method && (
                        <Text style={styles.fertilizerMethod}>
                          Application: {fertilizer.application_method}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Potential Issues */}
          {result.potential_issues && result.potential_issues.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle" size={20} color="#FF9800" />
                <Text style={styles.sectionTitle}>Potential Issues</Text>
              </View>
              <View style={styles.card}>
                {result.potential_issues.map((issue, index) => (
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

          {/* Actionable Insights */}
          {result.actionable_insights && result.actionable_insights.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="lightbulb-on" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Actionable Insights</Text>
              </View>
              <View style={styles.card}>
                {result.actionable_insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={styles.insightNumber}>
                      <Text style={styles.insightNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.insightContent}>
                      {insight.title && (
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                      )}
                      <Text style={styles.insightText}>
                        {insight.description || insight}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cost Savings */}
          {result.cost_savings && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="savings" size={20} color="#0B8457" />
                <Text style={styles.sectionTitle}>Expected Savings</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.savingsText}>{result.cost_savings}</Text>
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
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
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
  scheduleItem: {
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2332',
  },
  scheduleText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 28,
  },
  fertilizerItem: {
    paddingVertical: 8,
  },
  fertilizerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fertilizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fertilizerDetails: {
    gap: 6,
    marginBottom: 8,
  },
  fertilizerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fertilizerDetailText: {
    fontSize: 13,
    color: '#666',
  },
  fertilizerMethod: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
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
  insightItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  insightNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  savingsText: {
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
    borderColor: '#FF9800',
  },
  primaryButton: {
    elevation: 2,
    shadowColor: '#FF9800',
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

export default IrrigationResultScreen;