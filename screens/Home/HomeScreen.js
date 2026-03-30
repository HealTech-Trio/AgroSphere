import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationsContext';
import { useDevice } from '../../context/DeviceContext';
import DeviceCard from './components/DeviceCard';
import QuickInsightCard from './components/QuickInsightCard';
import WeatherWidget from './components/WeatherWidget';
import AgriSphereLogo from '../../assets/Images/Logo_c.png';
import { COLORS } from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();
  const { connectedDevice, connectionStatus, realTimeData } = useDevice();
  
  const [refreshing, setRefreshing] = useState(false);
  const [weatherKey, setWeatherKey] = useState(0); // Key to force WeatherWidget refresh
  const { unreadAlertCount, generateAlertsFromSensorData, generateWeatherAlertsFromData } = useNotifications();

  // NEW: State to store current weather data for alert re-triggering
  const [currentWeatherData, setCurrentWeatherData] = useState(null);

  // Generate insights based on real device data
  const generateInsights = () => {
    const insights = [];

    if (realTimeData) {
      // Soil moisture insight
      if (realTimeData.soil < 20) {
        insights.push({
          title: "Irrigation Needed",
          description: `Soil moisture is low (${realTimeData.soil}%). Consider watering your crops.`,
          icon: "water",
          color: "#FF9800",
        });
      } else if (realTimeData.soil > 80) {
        insights.push({
          title: "Overwatering Alert",
          description: `Soil moisture is high (${realTimeData.soil}%). Reduce irrigation to prevent root rot.`,
          icon: "water-off",
          color: "#F44336",
        });
      }

      // Temperature insight
      if (realTimeData.temperature > 30) {
        insights.push({
          title: "High Temperature",
          description: `Temperature is ${realTimeData.temperature}°C. Monitor plant stress levels.`,
          icon: "thermometer",
          color: "#FF5722",
        });
      } else if (realTimeData.temperature < 10) {
        insights.push({
          title: "Low Temperature",
          description: `Temperature is ${realTimeData.temperature}°C. Protect sensitive crops from cold.`,
          icon: "thermometer",
          color: "#03A9F4",
        });
      }

      // Humidity insight
      if (realTimeData.humidity > 80) {
        insights.push({
          title: "High Humidity",
          description: `Humidity is ${realTimeData.humidity}%. Watch for fungal diseases.`,
          icon: "cloud",
          color: "#2196F3",
        });
      }
    }

    // Default insights if no device data
    if (insights.length === 0) {
      insights.push(
        {
          title: "Optimal Planting Window",
          description: "Next 3 days are ideal for planting tomatoes based on weather forecast",
          icon: "leaf",
          color: "#0B8457"
        },
        {
          title: "Connect Your Device",
          description: "Connect an IoT device to get personalized farming insights",
          icon: "chip",
          color: "#9B9B9B",
        }
      );
    }

    return insights;
  };

  useEffect(() => {
    if (realTimeData) {
      generateAlertsFromSensorData(realTimeData);
    }
  }, [realTimeData, generateAlertsFromSensorData]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    // Force WeatherWidget to refresh by changing its key
    setWeatherKey(prev => prev + 1);
    
    // Simulate additional refresh operations
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // NEW: Handle weather data received from WeatherWidget
  const handleWeatherDataReceived = (weatherData) => {
    console.log('🌤️ Weather data received for alert analysis:', weatherData);
    setCurrentWeatherData(weatherData); // Store weather data for re-triggering
    
    if (weatherData && generateWeatherAlertsFromData) {
      generateWeatherAlertsFromData(weatherData);
    }
  };

  // NEW: Re-trigger weather alerts when app refreshes or data changes
  useEffect(() => {
    if (currentWeatherData && generateWeatherAlertsFromData) {
      console.log('🚨 Re-checking weather data for alerts on refresh...');
      generateWeatherAlertsFromData(currentWeatherData);
    }
  }, [currentWeatherData, generateWeatherAlertsFromData]);

  const insights = generateInsights();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={COLORS.gradients.heroSoft}
        style={[styles.gradientOverlay, { height: insets.top + 120 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            {/* AgriSphere Logo Icon */}
            <View style={styles.logoIcon}>
              <Image source={AgriSphereLogo} style={styles.logo}></Image>
            </View>
            
            {/* App Name with Gradient Effect */}
            <View style={styles.appNameContainer}>
              <Text style={styles.appName}>
                <Text style={styles.agriText}>Agri</Text>
                <Text style={styles.sphereText}>Sphere</Text>
              </Text>
              <View style={styles.tagline}>
                <Text style={styles.taglineText}>Smart Farming</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* Device icon */}
          <TouchableOpacity 
            style={styles.headerIcon}>
            <Ionicons name="hardware-chip-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View>
              <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Weather')}
          >
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Weather</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Schedule')}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="calendar-check" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyCrops')}
          >
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="sprout" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>My Crops</Text>
          </TouchableOpacity>
          
          {/* UPDATED ALERT BUTTON */}
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Alerts')}
          >
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={COLORS.primary} />
              {/* UPDATED: Show real ALERT count, not notification count */}
              {unreadAlertCount > 0 && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>
                    {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.actionText}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Weather Widget - with key to force refresh AND weather alert callback */}
        <WeatherWidget 
          key={weatherKey} 
          onWeatherDataReceived={handleWeatherDataReceived}
        />

        {/* Connected Device Card - Now dynamic */}
        <DeviceCard />

        {/* Quick Insights - Dynamic based on real data */}
        <Text style={styles.sectionTitle}>
          {connectedDevice && connectionStatus === 'connected' ? "Today's Insights" : "Farming Insights"}
        </Text>
        
        {insights.map((insight, index) => (
          <QuickInsightCard
            key={index}
            title={insight.title}
            description={insight.description}
            icon={insight.icon}
            color={insight.color}
            actionText={insight.actionText}
          />
        ))}

        {/* Connection Status Banner */}
        {connectedDevice && connectionStatus === 'connected' && (
          <View style={styles.connectionBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#0B8457" />
            <Text style={styles.connectionBannerText}>
              Device connected • Real-time data active
            </Text>
          </View>
        )}

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 30,
    zIndex: 1,
  },
  headerLeft: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -6,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 10, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    marginBottom: 5,
  },
  logo:{
    width: '100%',
    height: '100%'
  },
  appNameContainer: {
    flexDirection: 'column',
    paddingLeft: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 30,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  agriText: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.14)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sphereText: {
    color: COLORS.primary,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.14)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  taglineText: {
    fontSize: 9,
    color: COLORS.primaryDark,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: -5,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  actionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  alertBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  alertBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  connectionBannerText: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default HomeScreen;