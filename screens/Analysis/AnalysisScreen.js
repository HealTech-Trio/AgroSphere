// screens/Analysis/AnalysisScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  FontAwesome5,
  MaterialIcons 
} from '@expo/vector-icons';
import AnalysisToolCard from './components/AnalysisToolCard';
import ProTipCard from './components/ProTipCard';
import { COLORS } from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

const AnalysisScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const analysisTools = [
    {
      id: 'disease',
      title: 'Disease Detection',
      actionText: 'Scan Now',
      icon: 'scan-helper',
      iconFamily: 'MaterialCommunityIcons',
      color: '#0B8457',
      gradient: ['#0B8457', '#66BB6A'],
      lightGradient: ['rgba(11, 132, 87, 0.25)', 'rgba(11, 132, 87, 0.05)'],
      description: 'AI-powered plant health analysis',
    },
    {
      id: 'yield',
      title: 'Yield Prediction',
      actionText: 'Predict Now',
      icon: 'trending-up',
      iconFamily: 'MaterialIcons',
      color: '#5B9FFF',
      gradient: ['#5B9FFF', '#7AB0FF'],
      lightGradient: ['rgba(91, 159, 255, 0.25)', 'rgba(91, 159, 255, 0.05)'],
      description: 'Forecast your harvest potential',
    },
    {
      id: 'soil',
      title: 'Soil Health',
      actionText: 'Analyze Now',
      icon: 'layers',
      iconFamily: 'MaterialIcons',
      color: '#95A99C',
      gradient: ['#95A99C', '#A8B5AC'],
      lightGradient: ['rgba(149, 169, 156, 0.25)', 'rgba(149, 169, 156, 0.05)'],
      description: 'Comprehensive soil assessment',
    },
    {
      id: 'irrigation',
      title: 'Irrigation & Fertilizer',
      actionText: 'Optimize Now',
      icon: 'water-drop',
      iconFamily: 'MaterialIcons',
      color: '#FF9800',
      gradient: ['#FF9800', '#FFA726'],
      lightGradient: ['rgba(255, 152, 0, 0.25)', 'rgba(255, 152, 0, 0.05)'],
      description: 'Optimize water and nutrient usage',
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);
  
  const handleToolPress = (tool) => {
    // Map tool IDs to screen names
    const screenMapping = {
      'disease': 'DiseaseDetection',
      'yield': 'YieldPrediction',
      'soil': 'SoilHealth',
      'irrigation': 'IrrigationOptimization',
    };

    const screenName = screenMapping[tool.id];
    
    if (screenName) {
      navigation.navigate(screenName, { tool });
    } else {
      Alert.alert('Coming Soon', `${tool.title} will be available soon!`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.inkDark} />

      {/* Fixed Hero Header */}
      <LinearGradient
        colors={[COLORS.inkDark, COLORS.inkSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Deep Analysis</Text>
          <Text style={styles.heroTitle2}>AI-Powered Intelligence</Text>
          <Text style={styles.heroSub}>
            Disease detection · Yield prediction · Soil health
          </Text>
        </View>
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />
      </LinearGradient>

      <View style={styles.contentSheet}>

      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0B8457']}
            tintColor="#0B8457"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Pro Tip Card */}
        <ProTipCard />

        {/* AI Analysis Tools */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Analysis Tools</Text>
          </View>
          
          <View style={styles.toolsGrid}>
            {analysisTools.map((tool, index) => (
              <AnalysisToolCard
                key={tool.id}
                tool={tool}
                onPress={() => handleToolPress(tool)}
                index={index}
              />
            ))}
          </View>
        </View>

        {/* 3D Visualization */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3D Visualization</Text>
          </View>

          <TouchableOpacity
            style={styles.vizCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FarmVisualization')}
          >
            <LinearGradient
              colors={[COLORS.inkDark, COLORS.inkSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.vizCardGradient}
            >
              <View style={styles.vizCardContent}>
                <View style={styles.vizCardIcon}>
                  <Ionicons name="cube-outline" size={32} color={COLORS.primaryLight} />
                </View>
                <View style={styles.vizCardText}>
                  <Text style={styles.vizCardTitle}>Smart Farm 3D</Text>
                  <Text style={styles.vizCardDesc}>
                    Interactive farm with IoT sensors, soil moisture & robotic weeder
                  </Text>
                </View>
                <Ionicons name="play-circle" size={36} color={COLORS.primaryLight} />
              </View>
              <View style={styles.vizDeco} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Drone AI System */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Drone AI System</Text>
          </View>

          <TouchableOpacity
            style={styles.vizCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('DroneAI')}
          >
            <LinearGradient
              colors={['#1B3A4B', '#274C5B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.vizCardGradient}
            >
              <View style={styles.vizCardContent}>
                <View style={[styles.vizCardIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                  <MaterialCommunityIcons name="quadcopter" size={32} color="#3B82F6" />
                </View>
                <View style={styles.vizCardText}>
                  <Text style={styles.vizCardTitle}>Drone AI Dashboard</Text>
                  <Text style={styles.vizCardDesc}>
                    YOLOv5 weed & crop detection with real-time drone controls
                  </Text>
                </View>
                <Ionicons name="play-circle" size={36} color="#3B82F6" />
              </View>
              <View style={styles.vizDeco} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Last Update Section */}
        <View style={styles.lastUpdateContainer}>
          <View style={styles.onlineIndicator} />
          <Text style={styles.lastUpdateText}>
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 74 }} />
      </Animated.ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  heroHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 44, paddingHorizontal: 24,
    position: 'relative', overflow: 'hidden',
  },
  heroContent: { zIndex: 2 },
  heroTitle: { fontSize: 30, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  heroTitle2: { fontSize: 30, fontWeight: '900', color: COLORS.primaryLight, letterSpacing: -0.5 },
  heroSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 6,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2332',
    letterSpacing: -0.3,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lastUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 67,
    paddingHorizontal: 20,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0B8457',
    marginRight: 8,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#9B9B9B',
  },
  vizCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  vizCardGradient: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  vizCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  vizCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(46,196,182,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  vizCardText: {
    flex: 1,
    marginRight: 10,
  },
  vizCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  vizCardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 16,
  },
  vizDeco: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});

export default AnalysisScreen;