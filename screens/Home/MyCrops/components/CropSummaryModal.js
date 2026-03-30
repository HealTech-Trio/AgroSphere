// screens/MyCrops/components/CropSummaryModal.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CropSummaryModal = ({ visible, crop, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.8);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  // Early return if no crop
  if (!crop) return null;

  // Format Firebase timestamp
  const formatFirebaseDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Not set';
    try {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date error';
    }
  };

  // Get progress color based on growth stage
  const getProgressColor = (percentage) => {
    if (percentage < 20) return '#EF4444';
    if (percentage < 50) return '#F59E0B';
    if (percentage < 90) return '#10B981';
    return '#047857';
  };

  const progressColor = getProgressColor(crop.growthStage);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backgroundTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View 
            style={[
              styles.gradientBackground,
              {
                opacity: fadeAnim
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(11, 132, 87, 0.6)', 'rgba(11, 132, 87, 0.3)', 'rgba(11, 132, 87, 0.1)']}
              style={styles.gradient}
            />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {/* White Content Card */}
            <View style={styles.contentCard}>
              {/* Header with gradient */}
              <LinearGradient
                colors={['#0B8457', '#45a049']}
                style={styles.headerGradient}
              >
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                  <View style={styles.cropIcon}>
                    <MaterialCommunityIcons name="sprout" size={32} color="#FFFFFF" />
                  </View>
<View style={styles.titleContainer}>
  <Text style={styles.cropName}>{crop.cropName}</Text>
  <Text style={styles.cropType}>{crop.cropTypeName}</Text>
  {/* crop summary sentence */}
  <Text style={styles.summarySentence}>
    Thriving at <Text style={styles.boldText}>{crop.farmName}</Text> with{' '}
    <Text style={styles.boldText}>{crop.growthStage || 0}%</Text> growth progress 
    across <Text style={styles.boldText}>{crop.area || 0} hectares</Text> of land.
  </Text>
</View>
                </View>
              </LinearGradient>

              <ScrollView 
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContentContainer}
              >
                {/* Quick Stats Cards */}
                <View style={styles.statsCards}>
                  <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
                    <MaterialCommunityIcons name="chart-line" size={24} color={progressColor} />
                    <Text style={styles.statCardValue}>{crop.growthStage}%</Text>
                    <Text style={styles.statCardLabel}>Growth</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialCommunityIcons name="texture-box" size={24} color="#2196F3" />
                    <Text style={styles.statCardValue}>{crop.area}</Text>
                    <Text style={styles.statCardLabel}>Hectares</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                    <MaterialCommunityIcons name="farm" size={24} color="#FF9800" />
                    <Text style={styles.statCardValue}>{crop.farmName}</Text>
                    <Text style={styles.statCardLabel}>Farm</Text>
                  </View>
                </View>

                {/* Growth Progress Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="progress-clock" size={20} color="#0B8457" />
                    <Text style={styles.sectionTitle}>Growth Progress</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Current Stage</Text>
                      <Text style={[styles.progressPercentage, { color: progressColor }]}>
                        {crop.growthStage}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${Math.min(crop.growthStage, 100)}%`,
                            backgroundColor: progressColor
                          }
                        ]} 
                      />
                    </View>
                    <View style={styles.progressStages}>
                      <Text style={styles.progressStageText}>Planted</Text>
                      <Text style={styles.progressStageText}>Growing</Text>
                      <Text style={styles.progressStageText}>Mature</Text>
                      <Text style={styles.progressStageText}>Ready</Text>
                    </View>
                  </View>
                </View>

                {/* Crop Details Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="information" size={20} color="#0B8457" />
                    <Text style={styles.sectionTitle}>Crop Details</Text>
                  </View>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <MaterialCommunityIcons name="sprout" size={18} color="#666" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Crop Type</Text>
                        <Text style={styles.detailValue}>{crop.cropTypeName}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <MaterialCommunityIcons name="tag" size={18} color="#666" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{crop.cropType}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="business" size={18} color="#666" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Farm Name</Text>
                        <Text style={styles.detailValue}>{crop.farmName}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="location" size={18} color="#666" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Farm ID</Text>
                        <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                          {crop.farmId?.substring(0, 8)}...
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Timeline Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="timeline" size={20} color="#0B8457" />
                    <Text style={styles.sectionTitle}>Timeline</Text>
                  </View>
                  <View style={styles.timeline}>
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: '#0B8457' }]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Created</Text>
                        <Text style={styles.timelineValue}>{formatFirebaseDate(crop.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: '#FF9800' }]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Last Updated</Text>
                        <Text style={styles.timelineValue}>{formatFirebaseDate(crop.updatedAt)}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Technical Info Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="code-tags" size={20} color="#0B8457" />
                    <Text style={styles.sectionTitle}>Technical Information</Text>
                  </View>
                  <View style={styles.techInfo}>
                    <View style={styles.techRow}>
                      <Text style={styles.techLabel}>Crop ID:</Text>
                      <Text style={styles.techValue} numberOfLines={1} ellipsizeMode="middle">
                        {crop.id}
                      </Text>
                    </View>
                    <View style={styles.techRow}>
                      <Text style={styles.techLabel}>Firebase ID:</Text>
                      <Text style={styles.techValue} numberOfLines={1} ellipsizeMode="middle">
                        {crop.firebaseId}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bottom spacing */}
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backgroundTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 24,
    paddingTop: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  cropIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
  },
  cropName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  cropType: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  statsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2332',
    marginTop: 8,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#7B7B7B',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginLeft: 8,
  },
  progressContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStageText: {
    fontSize: 10,
    color: '#9B9B9B',
    fontWeight: '500',
  },
  detailsGrid: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  detailIcon: {
    width: 32,
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7B7B7B',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2332',
  },
  timeline: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    marginLeft: 12,
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#7B7B7B',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2332',
  },
  techInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  techLabel: {
    fontSize: 12,
    color: '#7B7B7B',
    width: 80,
  },
  techValue: {
    fontSize: 12,
    color: '#1A2332',
    fontFamily: 'monospace',
    flex: 1,
  },

  summarySentence: {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: 14,
  textAlign: 'center',
  lineHeight: 20,
  marginTop: 12,
  fontWeight: '400',
},
boldText: {
  fontWeight: '700',
  color: '#FFFFFF',
},
});

export default CropSummaryModal;