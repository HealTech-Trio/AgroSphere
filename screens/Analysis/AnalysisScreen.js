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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Animated Header Background */}
      <Animated.View
        style={[
          styles.headerBackground,
          {
            opacity: headerOpacity,
            transform: [{ scale: headerScale }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(11, 132, 87, 0.25)', 'transparent']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Deep Analysis</Text>
            <Text style={styles.headerSubtitle}>AI-Powered Farm Intelligence</Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <LinearGradient
              colors={['#0B8457', '#065A3B']}
              style={styles.headerButtonGradient}
            >
              <MaterialIcons name="auto-fix-high" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
  },
  headerGradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A2332',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#0B8457',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: -30,
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
});

export default AnalysisScreen;