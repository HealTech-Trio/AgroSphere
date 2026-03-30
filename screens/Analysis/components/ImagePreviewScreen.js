// screens/Analysis/components/ImagePreviewScreen.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ImagePreviewScreen = ({ visible, image, toolConfig, onConfirm, onRetake, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      statusBarTranslucent
      transparent={false}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Background Gradient */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.98)']}
          style={styles.backgroundGradient}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <View style={styles.headerButtonInner}>
                <Ionicons name="close" size={26} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Review Image</Text>
              <Text style={styles.headerSubtitle}>Confirm before analysis</Text>
            </View>

            <View style={{ width: 48 }} />
          </Animated.View>

          {/* Image Container */}
          <Animated.View 
            style={[
              styles.imageContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.imageCard}>
              <LinearGradient
                colors={[`${toolConfig.color}20`, `${toolConfig.color}10`]}
                style={styles.imageGradientBorder}
              >
                <Image 
                  source={{ uri: image }} 
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>

            {/* Image Quality Indicator */}
            <View style={styles.qualityBadge}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#0B8457" />
              <Text style={styles.qualityText}>Good Quality</Text>
            </View>
          </Animated.View>

          {/* Tips Card */}
          <Animated.View style={[styles.tipsCard, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
              style={styles.tipsGradient}
            >
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb-outline" size={20} color="#FFD700" />
                <Text style={styles.tipsTitle}>Quick Tips</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <View style={[styles.tipDot, { backgroundColor: toolConfig.color }]} />
                  <Text style={styles.tipText}>Ensure the plant is clearly visible</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipDot, { backgroundColor: toolConfig.color }]} />
                  <Text style={styles.tipText}>Good lighting improves accuracy</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipDot, { backgroundColor: toolConfig.color }]} />
                  <Text style={styles.tipText}>Focus on affected areas if any</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View style={[styles.actionButtons, { opacity: fadeAnim }]}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={onRetake}
              activeOpacity={0.7}
            >
              <View style={styles.secondaryButtonInner}>
                <MaterialCommunityIcons name="camera-retake" size={22} color="white" />
                <Text style={styles.secondaryButtonText}>Retake Photo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={toolConfig.gradient}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="check-circle" size={22} color="white" />
                <Text style={styles.primaryButtonText}>Analyze Image</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 48,
    height: 48,
  },
  headerButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  imageCard: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  imageGradientBorder: {
    flex: 1,
    padding: 3,
  },
  previewImage: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 21,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B8457',
  },
  tipsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipsGradient: {
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tipText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ImagePreviewScreen;