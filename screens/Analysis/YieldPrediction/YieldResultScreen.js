// screens/Analysis/YieldPrediction/YieldResultScreen.js
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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

const YieldResultScreen = ({
  visible,
  result,
  toolConfig,
  iotData,
  farmData,
  cropData,
  plantingDate,
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
        id: `yield_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        result: result,
        farm_data: farmData,
        crop_data: cropData,
        planting_date: plantingDate?.toISOString(),
        iot_data: iotData,
        timestamp: Date.now(),
        analysis_type: 'yield',
      };

      const historyKey = '@analysis_history_yield';
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      const updatedHistory = [historyEntry, ...history];
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      if (onSaveComplete) {
        onSaveComplete(historyEntry);
      }

      Alert.alert(
        'Saved Successfully',
        'Yield prediction has been saved to your history.',
        [
          {
            text: 'View History',
            onPress: () => {
              onClose();
            },
          },
          {
            text: 'New Prediction',
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

  const getConfidenceColor = (score) => {
    if (score >= 40) return '#FFA726';
    if (score >= 25) return '#FF9800';
    return '#FF5722';
  };

  const getConfidenceLevel = (score) => {
    if (score >= 40) return 'Medium';
    if (score >= 25) return 'Low-Medium';
    return 'Low';
  };

  if (!visible || !result) return null;

  const confidenceScore = Math.min(result.confidence_score || 0, 55);
  const confidenceColor = getConfidenceColor(confidenceScore);
  const confidenceLevel = getConfidenceLevel(confidenceScore);

  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(91, 159, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontSize: 10,
    },
  };

  // Growth Timeline Data
  const growthTimelineData = {
    labels: result.growth_timeline?.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
    datasets: [{
      data: result.growth_timeline?.data || [20, 35, 50, 70, 85],
      color: (opacity = 1) => `rgba(91, 159, 255, ${opacity})`,
      strokeWidth: 3
    }]
  };

  // Weather Impact Data
  const weatherImpactData = {
    labels: result.weather_impact?.labels || ['Temp', 'Rain', 'Sun', 'Wind'],
    datasets: [{
      data: result.weather_impact?.data || [0.7, 0.5, 0.8, 0.3]
    }]
  };

  // Risk Factors Data
  const riskData = {
    labels: ['Disease', 'Pests', 'Weather'],
    data: [
      (result.risk_factors?.disease || 25) / 100,
      (result.risk_factors?.pests || 18) / 100,
      (result.risk_factors?.weather || 42) / 100,
    ],
    colors: ['#FF5722', '#FF9800', '#FFA726']
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Custom Confidence Gauge
  const ConfidenceGauge = ({ score, maxScore = 55 }) => {
    const percentage = (score / maxScore) * 100;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={styles.gaugeContainer}>
        <Svg width={160} height={160}>
          <G rotation="-90" origin="80, 80">
            <Circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#E8E8E8"
              strokeWidth="12"
              fill="none"
            />
            <Circle
              cx="80"
              cy="80"
              r={radius}
              stroke={confidenceColor}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
          <SvgText
            x="65"
            y="80"
            textAnchor="middle"
            alignmentBaseline="central"
            fontSize="32"
            fontWeight="bold"
            fill={confidenceColor}
          >
            {score}%
          </SvgText>
        </Svg>
      </View>
    );
  };

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
            <Text style={styles.headerTitle}>Yield Prediction</Text>
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
          {/* Confidence Score Card */}
          <Animated.View style={[styles.scoreCard, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[`${confidenceColor}15`, `${confidenceColor}08`]}
              style={styles.scoreGradient}
            >
              <ConfidenceGauge score={confidenceScore} maxScore={100} />
              <Text style={styles.confidenceLevel}>{confidenceLevel} Confidence</Text>
              <Text style={styles.confidenceNote}>
                Based on limited data. Predictions are probabilistic estimates.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Yield Estimate Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-box" size={20} color={toolConfig.color} />
              <Text style={styles.sectionTitle}>Predicted Yield</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.yieldEstimate}>
                <View style={styles.yieldRow}>
                  <Text style={styles.yieldLabel}>Per Hectare:</Text>
                  <Text style={styles.yieldValue}>
                    {result.yield_estimate?.min || '4.2'} - {result.yield_estimate?.max || '5.8'} tons
                  </Text>
                </View>
                <View style={styles.yieldRow}>
                  <Text style={styles.yieldLabel}>Total ({cropData?.area} ha):</Text>
                  <Text style={[styles.yieldValue, styles.totalYield]}>
                    {result.yield_estimate?.total_min || '23.1'} - {result.yield_estimate?.total_max || '31.9'} tons
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Harvest Date Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color={toolConfig.color} />
              <Text style={styles.sectionTitle}>Harvest Timeline</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.harvestInfo}>
                <View style={styles.dateCard}>
                  <MaterialCommunityIcons name="calendar-start" size={24} color="#0B8457" />
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Planting Date</Text>
                    <Text style={styles.dateValue}>{formatDate(plantingDate)}</Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#9B9B9B" />
                <View style={styles.dateCard}>
                  <MaterialCommunityIcons name="calendar-check" size={24} color={toolConfig.color} />
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Expected Harvest</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(result.harvest_date?.earliest)} - {formatDate(result.harvest_date?.latest)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.daysRemaining}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                <Text style={styles.daysText}>
                  {result.harvest_date?.days_range || '45-65'} days remaining
                </Text>
              </View>
            </View>
          </View>

          {/* Growth Timeline Chart */}
          {result.growth_timeline && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="chart-line" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Growth Projection</Text>
              </View>
              <View style={styles.card}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={growthTimelineData}
                    width={screenWidth - 80}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      fillShadowGradientFrom: '#5B9FFF',
                      fillShadowGradientTo: '#5B9FFF',
                      fillShadowGradientFromOpacity: 0.2,
                      fillShadowGradientToOpacity: 0,
                    }}
                    bezier
                    style={styles.chart}
                    withDots={true}
                    withInnerLines={false}
                    withOuterLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                  />
                </ScrollView>
                <Text style={styles.chartCaption}>
                  Projected growth based on current conditions
                </Text>
              </View>
            </View>
          )}

          {/* Weather Impact Chart */}
          {result.weather_impact && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color={toolConfig.color} />
                <Text style={styles.sectionTitle}>Weather Impact Analysis</Text>
              </View>
              <View style={styles.card}>
                <BarChart
                  data={weatherImpactData}
                  width={screenWidth - 80}
                  height={200}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  fromZero
                  yAxisSuffix=""
                />
                <Text style={styles.chartCaption}>
                  Impact of weather factors on yield (0-1 scale)
                </Text>
              </View>
            </View>
          )}

          {/* Risk Factors */}
          {result.risk_factors && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#FF9800" />
                <Text style={styles.sectionTitle}>Risk Assessment</Text>
              </View>
              <View style={styles.card}>
                <ProgressChart
                  data={riskData}
                  width={screenWidth - 80}
                  height={180}
                  strokeWidth={12}
                  radius={28}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1, index) => {
                      return riskData.colors[index] || '#5B9FFF';
                    },
                  }}
                  hideLegend={false}
                  style={styles.chart}
                />
                <View style={styles.riskLegend}>
                  {riskData.labels.map((label, index) => (
                    <View key={index} style={styles.riskItem}>
                      <View style={[styles.riskDot, { backgroundColor: riskData.colors[index] }]} />
                      <Text style={styles.riskLabel}>
                        {label}: {Math.round(riskData.data[index] * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Context Information */}
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
                      <Text style={styles.infoValue}>{cropData.cropName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Type:</Text>
                      <Text style={styles.infoValue}>{cropData.cropType}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Current Growth:</Text>
                      <Text style={styles.infoValue}>{cropData.growthStage}%</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Area:</Text>
                      <Text style={styles.infoValue}>{cropData.area} hectares</Text>
                    </View>
                  </>
                )}
                {iotData && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.iotIndicator}>
                      <Ionicons name="hardware-chip" size={16} color="#0B8457" />
                      <Text style={styles.iotText}>Analysis enhanced with IoT data</Text>
                    </View>
                  </>
                )}
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
                    <Text style={styles.recommendationText}>
                      {rec.description || rec}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimerCard}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#FF9800" />
            <Text style={styles.disclaimerText}>
              {result.disclaimer || 
               'This prediction is based on limited data and should be used as a general guide. Actual yield may vary significantly based on weather, management practices, and unforeseen factors.'}
            </Text>
          </View>

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
                New Prediction
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
  gaugeContainer: {
    marginBottom: 16,
  },
  confidenceLevel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  confidenceNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
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
  yieldEstimate: {
    gap: 12,
  },
  yieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  yieldLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  yieldValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  totalYield: {
    fontSize: 18,
    color: '#5B9FFF',
  },
  harvestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2332',
  },
  daysRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  daysText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartCaption: {
    fontSize: 11,
    color: '#9B9B9B',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  riskLegend: {
    marginTop: 16,
    gap: 8,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  riskLabel: {
    fontSize: 13,
    color: '#666',
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
  iotIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  iotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0B8457',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  recommendationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5B9FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
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
    borderColor: '#5B9FFF',
  },
  primaryButton: {
    elevation: 2,
    shadowColor: '#5B9FFF',
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

export default YieldResultScreen;