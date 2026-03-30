// screens/Analysis/components/ScannerAnimation.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ScannerAnimation = ({ visible, onCapture, onClose, toolColor = '#0B8457' }) => {
  const [camera, setCamera] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [permission, requestPermission] = useCameraPermissions();
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Animated scanning line
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLinePosition, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLinePosition, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const handleCapture = async () => {
    if (camera && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await camera.takePictureAsync({
          quality: 1,
          base64: false,
          skipProcessing: false,
        });
        onCapture(photo);
      } catch (error) {
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const getFlashIcon = () => {
    if (flashMode === 'on') return 'flash';
    if (flashMode === 'auto') return 'flash-auto';
    return 'flash-off';
  };

  const getFlashColor = () => {
    if (flashMode === 'on') return '#FFD700';
    if (flashMode === 'auto') return '#FFA500';
    return 'white';
  };

  const translateY = scanLinePosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  // Check permissions
  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.98)']}
            style={styles.permissionOverlay}
          >
            <Animated.View style={[styles.permissionContainer, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.permissionCard}>
                <LinearGradient
                  colors={[`${toolColor}10`, `${toolColor}05`]}
                  style={styles.permissionGradient}
                >
                  <MaterialCommunityIcons name="camera-off" size={64} color="#9B9B9B" />
                  <Text style={styles.permissionText}>Camera Permission Required</Text>
                  <Text style={styles.permissionSubtext}>
                    We need access to your camera to scan plants and analyze their health
                  </Text>
                  <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <LinearGradient
                      colors={[toolColor, `${toolColor}CC`]}
                      style={styles.permissionButtonGradient}
                    >
                      <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </Animated.View>
          </LinearGradient>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <CameraView 
          style={styles.camera} 
          ref={(ref) => setCamera(ref)}
          facing="back"
          enableTorch={flashMode === 'on'}
        >
          {/* Dark overlay for better UI visibility */}
          <View style={styles.darkOverlay} />

          {/* Top Controls Bar */}
          <View style={styles.topControlsBar}>
            <TouchableOpacity 
              style={styles.topButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <View style={styles.topButtonInner}>
                <Ionicons name="close" size={26} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.topCenterInfo}>
              <View style={styles.scanningBadge}>
                <View style={styles.scanningDot} />
                <Text style={styles.scanningText}>AI SCANNING</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.topButton}
              onPress={toggleFlash}
              activeOpacity={0.8}
            >
              <View style={styles.topButtonInner}>
                <Ionicons name={getFlashIcon()} size={24} color={getFlashColor()} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Scanning Frame Overlay */}
          <View style={styles.scanningFrame}>
            {/* Corner decorations */}
            <View style={[styles.corner, styles.topLeft, { borderTopColor: toolColor, borderLeftColor: toolColor }]} />
            <View style={[styles.corner, styles.topRight, { borderTopColor: toolColor, borderRightColor: toolColor }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderBottomColor: toolColor, borderLeftColor: toolColor }]} />
            <View style={[styles.corner, styles.bottomRight, { borderBottomColor: toolColor, borderRightColor: toolColor }]} />
            
            {/* Animated Scan Line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY }],
                  backgroundColor: toolColor,
                  shadowColor: toolColor,
                },
              ]}
            />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.5)']}
              style={styles.instructionsGradient}
            >
              <MaterialCommunityIcons name="scan-helper" size={32} color={toolColor} />
              <Text style={styles.instructionsTitle}>AI Scanning Active</Text>
              <Text style={styles.instructionsText}>
                Position the plant within the frame for best results
              </Text>
            </LinearGradient>
          </View>

          {/* Capture Button */}
          <View style={styles.captureContainer}>
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={handleCapture}
              disabled={isCapturing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[toolColor, `${toolColor}CC`]}
                style={styles.captureButtonGradient}
              >
                <View style={styles.captureButtonInner}>
                  {isCapturing ? (
                    <MaterialCommunityIcons 
                      name="loading" 
                      size={32} 
                      color="white" 
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name="camera" 
                      size={32} 
                      color="white" 
                    />
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.captureText}>
              {isCapturing ? 'Capturing...' : 'Tap to Capture'}
            </Text>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: width,
    height: height,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  permissionOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionContainer: {
    width: '100%',
    maxWidth: 400,
  },
  permissionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  permissionGradient: {
    padding: 32,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
  },
  permissionButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  topControlsBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topButton: {
    width: 48,
    height: 48,
  },
  topButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenterInfo: {
    flex: 1,
    alignItems: 'center',
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginRight: 8,
  },
  scanningText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
  scanningFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 300,
    height: 300,
    marginLeft: -150,
    marginTop: -150,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  instructionsContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  instructionsGradient: {
    padding: 16,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  captureButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default ScannerAnimation;