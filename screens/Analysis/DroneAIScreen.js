import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

// Simulated drone state
const DRONE_STATES = {
  DISCONNECTED: 'disconnected',
  GROUNDED: 'grounded',
  TAKING_OFF: 'taking_off',
  FLYING: 'flying',
  SCANNING: 'scanning',
  LANDING: 'landing',
  HOVERING: 'hovering',
};

const DRONE_STATUS_LABELS = {
  [DRONE_STATES.DISCONNECTED]: { label: 'Not Connected', color: '#EF4444', icon: 'close-circle' },
  [DRONE_STATES.GROUNDED]: { label: 'Grounded', color: '#94A3B8', icon: 'airplane-outline' },
  [DRONE_STATES.TAKING_OFF]: { label: 'Taking Off', color: '#F59E0B', icon: 'arrow-up-circle' },
  [DRONE_STATES.FLYING]: { label: 'In Flight', color: '#10B981', icon: 'navigate-circle' },
  [DRONE_STATES.SCANNING]: { label: 'Auto Scanning', color: '#3B82F6', icon: 'scan-circle' },
  [DRONE_STATES.LANDING]: { label: 'Landing', color: '#F59E0B', icon: 'arrow-down-circle' },
  [DRONE_STATES.HOVERING]: { label: 'Hovering', color: '#8B5CF6', icon: 'pause-circle' },
};

export default function DroneAIScreen({ navigation }) {
  const [droneState, setDroneState] = useState(DRONE_STATES.DISCONNECTED);
  const [stats, setStats] = useState({
    totalWeeds: '--',
    totalCrops: '--',
    framesProcessed: '--',
    obstaclesDetected: '--',
  });
  const [liveData, setLiveData] = useState({
    weedCount: '--',
    cropCount: '--',
    obstacleCount: '--',
    fps: '--',
    altitude: '--',
    battery: '--',
    signal: '--',
  });
  const [logs, setLogs] = useState([
    { time: new Date(), type: 'System', message: 'No drone connected', color: '#EF4444' },
  ]);
  const [uptime, setUptime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);
  const uptimeRef = useRef(null);

  // Pulse animation for live badge
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Scan animation
  useEffect(() => {
    if (droneState === DRONE_STATES.SCANNING) {
      const scan = Animated.loop(
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
      );
      scan.start();
      return () => scan.stop();
    } else {
      scanAnim.setValue(0);
    }
  }, [droneState]);

  // Simulate IoT data when flying/scanning
  useEffect(() => {
    if (droneState === DRONE_STATES.FLYING || droneState === DRONE_STATES.SCANNING) {
      setIsConnected(true);
      intervalRef.current = setInterval(() => {
        const newWeeds = Math.floor(Math.random() * 5);
        const newCrops = Math.floor(Math.random() * 8) + 2;
        const newObs = Math.random() < 0.15 ? 1 : 0;

        setLiveData({
          weedCount: newWeeds,
          cropCount: newCrops,
          obstacleCount: newObs,
          fps: Math.floor(Math.random() * 10) + 22,
          altitude: droneState === DRONE_STATES.SCANNING ? 8 + Math.random() * 2 : 5 + Math.random() * 10,
          battery: Math.max(10, 100 - Math.floor(uptime / 3)),
          signal: Math.max(60, 95 - Math.floor(Math.random() * 15)),
        });

        setStats(prev => ({
          totalWeeds: prev.totalWeeds + newWeeds,
          totalCrops: prev.totalCrops + newCrops,
          framesProcessed: prev.framesProcessed + 1,
          obstaclesDetected: prev.obstaclesDetected + newObs,
        }));

        if (newWeeds > 3) {
          addLog('Detection', `High weed density: ${newWeeds} weeds in frame`, '#F59E0B');
        }
        if (newObs > 0) {
          addLog('Alert', 'Obstacle detected — adjusting path', '#EF4444');
        }
      }, 2000);

      return () => clearInterval(intervalRef.current);
    } else {
      setIsConnected(droneState !== DRONE_STATES.GROUNDED);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [droneState, uptime]);

  // Uptime counter
  useEffect(() => {
    if (droneState !== DRONE_STATES.GROUNDED) {
      uptimeRef.current = setInterval(() => setUptime(u => u + 1), 1000);
      return () => clearInterval(uptimeRef.current);
    }
  }, [droneState]);

  const addLog = useCallback((type, message, color = '#10B981') => {
    setLogs(prev => [{ time: new Date(), type, message, color }, ...prev].slice(0, 30));
  }, []);

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const handleCommand = (command) => {
    switch (command) {
      case 'takeoff':
        if (droneState === DRONE_STATES.GROUNDED) {
          setDroneState(DRONE_STATES.TAKING_OFF);
          addLog('Command', 'Takeoff initiated', '#10B981');
          setTimeout(() => {
            setDroneState(DRONE_STATES.FLYING);
            addLog('Status', 'Drone is now airborne', '#10B981');
          }, 2000);
        }
        break;
      case 'land':
        if (droneState !== DRONE_STATES.GROUNDED) {
          setDroneState(DRONE_STATES.LANDING);
          addLog('Command', 'Landing initiated', '#F59E0B');
          setTimeout(() => {
            setDroneState(DRONE_STATES.GROUNDED);
            setUptime(0);
            setIsConnected(false);
            addLog('Status', 'Drone has landed safely', '#10B981');
          }, 2500);
        }
        break;
      case 'hover':
        if (droneState === DRONE_STATES.FLYING || droneState === DRONE_STATES.SCANNING) {
          setDroneState(DRONE_STATES.HOVERING);
          addLog('Command', 'Hovering in position', '#8B5CF6');
        }
        break;
      case 'auto_scan':
        if (droneState === DRONE_STATES.FLYING || droneState === DRONE_STATES.HOVERING) {
          setDroneState(DRONE_STATES.SCANNING);
          addLog('Command', 'Auto-scan mode activated — AI detection running', '#3B82F6');
        } else if (droneState === DRONE_STATES.GROUNDED) {
          Alert.alert('Drone Grounded', 'Takeoff before starting auto-scan.');
        }
        break;
      case 'forward':
      case 'backward':
      case 'left':
      case 'right':
        if (droneState === DRONE_STATES.FLYING || droneState === DRONE_STATES.HOVERING) {
          setDroneState(DRONE_STATES.FLYING);
          addLog('Move', `Moving ${command}`, '#2EC4B6');
        }
        break;
      default:
        break;
    }
  };

  const resetStats = () => {
    Alert.alert('Reset Stats', 'Reset all detection statistics?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setStats({ totalWeeds: 0, totalCrops: 0, framesProcessed: 0, obstaclesDetected: 0 });
          setLogs([{ time: new Date(), type: 'System', message: 'Statistics reset', color: '#F59E0B' }]);
          addLog('System', 'All statistics cleared', '#F59E0B');
        },
      },
    ]);
  };

  const statusInfo = DRONE_STATUS_LABELS[droneState];
  const isAirborne = droneState !== DRONE_STATES.GROUNDED && droneState !== DRONE_STATES.DISCONNECTED;
  const isDisconnected = droneState === DRONE_STATES.DISCONNECTED;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.inkDark} />

      {/* Hero Header */}
      <LinearGradient
        colors={[COLORS.inkDark, COLORS.inkSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.heroTitle}>Drone </Text>
                <Text style={styles.heroTitle2}>AI</Text>
              </View>
              <Text style={styles.heroSub}>YOLOv5 Weed & Crop Detection System</Text>
            </View>
            <View style={styles.statusBadge}>
              <Animated.View style={[styles.statusDot, { backgroundColor: statusInfo.color, opacity: pulseAnim }]} />
              <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
        </View>
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />
      </LinearGradient>

      {/* Content */}
      <View style={styles.contentSheet}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Disconnected Banner */}
          {isDisconnected && (
            <View style={styles.disconnectedBanner}>
              <LinearGradient
                colors={['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.02)']}
                style={styles.disconnectedGradient}
              >
                <View style={styles.disconnectedIconWrap}>
                  <MaterialCommunityIcons name="quadcopter" size={48} color="#94A3B8" />
                  <View style={styles.disconnectedSlash}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </View>
                </View>
                <Text style={styles.disconnectedTitle}>Drone Not Connected</Text>
                <Text style={styles.disconnectedDesc}>
                  No drone device detected. Connect your drone via WiFi to start real-time AI detection and farm scanning.
                </Text>
                <View style={styles.disconnectedSteps}>
                  <Text style={styles.stepText}>1. Power on your drone</Text>
                  <Text style={styles.stepText}>2. Connect to the drone's WiFi network</Text>
                  <Text style={styles.stepText}>3. The dashboard will auto-detect the drone</Text>
                </View>
                <View style={styles.disconnectedBadge}>
                  <Ionicons name="wifi-outline" size={14} color="#94A3B8" />
                  <Text style={styles.disconnectedBadgeText}>Waiting for connection...</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Live Detection Panel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Detection</Text>
            <View style={styles.livePanel}>
              <LinearGradient
                colors={['rgba(15,32,39,0.95)', 'rgba(27,58,75,0.95)']}
                style={styles.livePanelGradient}
              >
                <View style={styles.liveGrid}>
                  <LiveStat icon="leaf" color={isDisconnected ? '#555' : '#10B981'} label="Weeds" value={liveData.weedCount} />
                  <LiveStat icon="nutrition" color={isDisconnected ? '#555' : '#F59E0B'} label="Crops" value={liveData.cropCount} />
                  <LiveStat icon="alert-circle" color={isDisconnected ? '#555' : '#EF4444'} label="Obstacles" value={liveData.obstacleCount} />
                  <LiveStat icon="speedometer" color={isDisconnected ? '#555' : '#3B82F6'} label="FPS" value={liveData.fps} />
                </View>
                <View style={styles.liveDivider} />
                <View style={styles.liveGrid}>
                  <LiveStat icon="airplane" color={isDisconnected ? '#555' : '#8B5CF6'} label="Altitude" value={typeof liveData.altitude === 'number' ? `${liveData.altitude.toFixed(1)}m` : '--'} />
                  <LiveStat icon="battery-half" color={isDisconnected ? '#555' : (typeof liveData.battery === 'number' && liveData.battery < 25 ? '#EF4444' : '#10B981')} label="Battery" value={typeof liveData.battery === 'number' ? `${liveData.battery}%` : '--'} />
                  <LiveStat icon="wifi" color={isDisconnected ? '#555' : '#2EC4B6'} label="Signal" value={typeof liveData.signal === 'number' ? `${liveData.signal}%` : '--'} />
                  <LiveStat icon="time" color={isDisconnected ? '#555' : '#F4A261'} label="Uptime" value={isDisconnected ? '--' : formatUptime(uptime)} small />
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detection Statistics</Text>
            <View style={styles.statsGrid}>
              <StatCard title="Total Weeds" value={stats.totalWeeds} icon="leaf" color="#EF4444" gradient={['#EF4444', '#F87171']} />
              <StatCard title="Total Crops" value={stats.totalCrops} icon="nutrition" color="#10B981" gradient={['#10B981', '#34D399']} />
              <StatCard title="Frames" value={stats.framesProcessed} icon="images" color="#3B82F6" gradient={['#3B82F6', '#60A5FA']} />
              <StatCard title="Obstacles" value={stats.obstaclesDetected} icon="warning" color="#F59E0B" gradient={['#F59E0B', '#FBBF24']} />
            </View>
          </View>

          {/* Drone Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Drone Controls</Text>
            <View style={styles.controlPanel}>
              {/* Primary Actions */}
              <View style={styles.controlRow}>
                <ControlButton
                  icon="arrow-up-circle"
                  label="Takeoff"
                  color="#10B981"
                  onPress={() => handleCommand('takeoff')}
                  disabled={isAirborne || isDisconnected}
                />
                <ControlButton
                  icon="arrow-down-circle"
                  label="Land"
                  color="#EF4444"
                  onPress={() => handleCommand('land')}
                  disabled={!isAirborne || isDisconnected}
                />
                <ControlButton
                  icon="pause-circle"
                  label="Hover"
                  color="#8B5CF6"
                  onPress={() => handleCommand('hover')}
                  disabled={!isAirborne || isDisconnected}
                />
                <ControlButton
                  icon="scan-circle"
                  label="Auto Scan"
                  color="#3B82F6"
                  onPress={() => handleCommand('auto_scan')}
                  active={droneState === DRONE_STATES.SCANNING}
                  disabled={isDisconnected}
                />
              </View>

              {/* Directional Controls */}
              <Text style={styles.controlSubtitle}>Movement</Text>
              <View style={styles.dpadContainer}>
                <View style={styles.dpadRow}>
                  <View style={styles.dpadSpacer} />
                  <DpadButton icon="chevron-up" onPress={() => handleCommand('forward')} disabled={!isAirborne || isDisconnected} />
                  <View style={styles.dpadSpacer} />
                </View>
                <View style={styles.dpadRow}>
                  <DpadButton icon="chevron-back" onPress={() => handleCommand('left')} disabled={!isAirborne || isDisconnected} />
                  <View style={styles.dpadCenter}>
                    <Ionicons name="navigate" size={20} color={isAirborne && !isDisconnected ? COLORS.primaryLight : '#555'} />
                  </View>
                  <DpadButton icon="chevron-forward" onPress={() => handleCommand('right')} disabled={!isAirborne || isDisconnected} />
                </View>
                <View style={styles.dpadRow}>
                  <View style={styles.dpadSpacer} />
                  <DpadButton icon="chevron-down" onPress={() => handleCommand('backward')} disabled={!isAirborne || isDisconnected} />
                  <View style={styles.dpadSpacer} />
                </View>
              </View>

              {/* Utility Buttons */}
              <View style={[styles.controlRow, { marginTop: 12 }]}>
                <TouchableOpacity style={styles.utilBtn} onPress={resetStats}>
                  <Ionicons name="refresh" size={18} color="#EF4444" />
                  <Text style={styles.utilBtnText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Detection Log */}
          <View style={styles.section}>
            <View style={styles.logHeader}>
              <Text style={styles.sectionTitle}>Detection Log</Text>
              <View style={styles.inMemBadge}>
                <Text style={styles.inMemText}>In-Memory</Text>
              </View>
            </View>
            <View style={styles.logContainer}>
              {logs.map((log, i) => (
                <View key={i} style={styles.logEntry}>
                  <Text style={styles.logTime}>
                    {log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </Text>
                  <View style={[styles.logTypeBadge, { backgroundColor: log.color + '22' }]}>
                    <Text style={[styles.logTypeText, { color: log.color }]}>{log.type}</Text>
                  </View>
                  <Text style={styles.logMessage} numberOfLines={2}>{log.message}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 90 }} />
        </ScrollView>
      </View>
    </View>
  );
}

// --- Sub-components ---

const LiveStat = ({ icon, color, label, value, small }) => (
  <View style={styles.liveStat}>
    <Ionicons name={icon} size={18} color={color} />
    <Text style={[styles.liveValue, small && { fontSize: 13 }]}>{value}</Text>
    <Text style={styles.liveLabel}>{label}</Text>
  </View>
);

const StatCard = ({ title, value, icon, gradient }) => (
  <View style={styles.statCard}>
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCardIcon}>
      <Ionicons name={icon} size={20} color="#fff" />
    </LinearGradient>
    <Text style={styles.statCardValue}>{value}</Text>
    <Text style={styles.statCardLabel}>{title}</Text>
  </View>
);

const ControlButton = ({ icon, label, color, onPress, disabled, active }) => (
  <TouchableOpacity
    style={[
      styles.controlBtn,
      disabled && styles.controlBtnDisabled,
      active && { borderColor: color, borderWidth: 1.5, backgroundColor: color + '15' },
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={28} color={disabled ? '#555' : color} />
    <Text style={[styles.controlLabel, disabled && { color: '#555' }]}>{label}</Text>
  </TouchableOpacity>
);

const DpadButton = ({ icon, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.dpadBtn, disabled && styles.dpadBtnDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.6}
  >
    <Ionicons name={icon} size={24} color={disabled ? '#444' : COLORS.white} />
  </TouchableOpacity>
);

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  heroHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 44,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: { zIndex: 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroTitle: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  heroTitle2: { fontSize: 28, fontWeight: '900', color: COLORS.primaryLight, letterSpacing: -0.5 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroDeco1: {
    position: 'absolute', right: -30, top: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroDeco2: {
    position: 'absolute', right: 50, bottom: -50,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  contentSheet: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopRightRadius: 30,
    marginTop: -20,
    overflow: 'hidden',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 12 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A2332', marginBottom: 12 },

  // Disconnected Banner
  disconnectedBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  disconnectedGradient: {
    padding: 28,
    alignItems: 'center',
  },
  disconnectedIconWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  disconnectedSlash: {
    position: 'absolute',
    bottom: -4,
    right: -8,
  },
  disconnectedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A2332',
    marginBottom: 8,
  },
  disconnectedDesc: {
    fontSize: 13,
    color: '#5A6B7F',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  disconnectedSteps: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  stepText: {
    fontSize: 12,
    color: '#5A6B7F',
    marginBottom: 6,
    fontWeight: '500',
  },
  disconnectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148,163,184,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disconnectedBadgeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginLeft: 6,
  },

  // Live Panel
  livePanel: { borderRadius: 16, overflow: 'hidden' },
  livePanelGradient: { padding: 16 },
  liveGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  liveDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  liveStat: { alignItems: 'center', flex: 1 },
  liveValue: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 4 },
  liveLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: '500' },

  // Stat Cards
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: (screenWidth - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statCardValue: { fontSize: 26, fontWeight: '800', color: '#1A2332' },
  statCardLabel: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' },

  // Controls
  controlPanel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between' },
  controlBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSecondary,
  },
  controlBtnDisabled: { opacity: 0.35 },
  controlLabel: { fontSize: 11, color: '#5A6B7F', marginTop: 4, fontWeight: '600' },
  controlSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },

  // D-Pad
  dpadContainer: { alignItems: 'center', marginVertical: 4 },
  dpadRow: { flexDirection: 'row', alignItems: 'center' },
  dpadSpacer: { width: 52, height: 52 },
  dpadBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.inkDark,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  dpadBtnDisabled: { backgroundColor: '#E2E8F0' },
  dpadCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(15,32,39,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },

  // Utility Buttons
  utilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  utilBtnText: { fontSize: 13, fontWeight: '600', color: '#EF4444', marginLeft: 6 },

  // Log
  logHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  inMemBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inMemText: { fontSize: 10, fontWeight: '700', color: '#3B82F6' },
  logContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    maxHeight: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logTime: { fontSize: 10, color: '#94A3B8', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', width: 62 },
  logTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  logTypeText: { fontSize: 9, fontWeight: '700' },
  logMessage: { flex: 1, fontSize: 11, color: '#5A6B7F' },
});
