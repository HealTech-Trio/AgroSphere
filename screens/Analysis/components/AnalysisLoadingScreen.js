// screens/Analysis/components/AnalysisLoadingScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const AnalysisLoadingScreen = ({ 
  visible, 
  progress = 0, 
  toolConfig,
  onCancel 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for the brain icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation for outer ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Scale animation for entrance
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getAnalysisStage = () => {
    if (progress < 20) return 'Initializing AI Model...';
    if (progress < 40) return 'Processing Image Data...';
    if (progress < 60) return 'Analyzing Plant Features...';
    if (progress < 80) return 'Cross-referencing Database...';
    if (progress < 95) return 'Generating Results...';
    return 'Finalizing Analysis...';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.95)']}
          style={styles.gradientOverlay}
        >
          <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
            {/* Main Content Card */}
            <View style={styles.contentCard}>
              <LinearGradient
                colors={[`${toolConfig.color}10`, `${toolConfig.color}05`]}
                style={styles.cardGradient}
              >
                {/* Rotating Outer Ring */}
                <Animated.View 
                  style={[
                    styles.outerRing,
                    { 
                      borderColor: toolConfig.color,
                      transform: [{ rotate }],
                    }
                  ]}
                />

                {/* AI Brain Icon with Pulse */}
                <Animated.View 
                  style={[
                    styles.iconContainer,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <LinearGradient
                    colors={toolConfig.gradient}
                    style={styles.iconGradient}
                  >
                    <MaterialCommunityIcons 
                      name="brain" 
                      size={48} 
                      color="white" 
                    />
                  </LinearGradient>
                </Animated.View>

                {/* Title */}
                <Text style={styles.title}>AI Analysis in Progress</Text>
                
                {/* Stage Description */}
                <Text style={styles.stageText}>{getAnalysisStage()}</Text>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBackground}>
                    <LinearGradient
                      colors={[toolConfig.gradient[0], toolConfig.gradient[1], `${toolConfig.gradient[1]}80`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressBarFill,
                        { width: `${progress}%` }
                      ]}
                    />
                  </View>
                  
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>{progress}%</Text>
                    <Text style={styles.progressSubtext}>Processing</Text>
                  </View>
                </View>

                {/* Processing Info */}
                <View style={styles.infoContainer}>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoDot, { backgroundColor: toolConfig.color }]} />
                    <Text style={styles.infoText}>Deep Learning Analysis</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoDot, { backgroundColor: toolConfig.color }]} />
                    <Text style={styles.infoText}>IoT Data Integration</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoDot, { backgroundColor: toolConfig.color }]} />
                    <Text style={styles.infoText}>Pattern Recognition</Text>
                  </View>
                </View>

                {/* Cancel Button */}
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <View style={styles.cancelButtonInner}>
                    <Ionicons name="close-circle-outline" size={20} color="#F44336" />
                    <Text style={styles.cancelButtonText}>Cancel Analysis</Text>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Bottom Tip */}
            <View style={styles.tipContainer}>
              <Ionicons name="bulb-outline" size={18} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.tipText}>
                This may take 10-30 seconds depending on image quality
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  contentCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    top: 32,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  stageText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 28,
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  progressSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cancelButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 67, 54, 0.3)',
    overflow: 'hidden',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  cancelButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F44336',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
    paddingHorizontal: 16,
  },
  tipText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    flex: 1,
  },
});

export default AnalysisLoadingScreen;