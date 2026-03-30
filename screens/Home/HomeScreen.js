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
import { Platform } from 'react-native';
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.inkDark} />

      {/* Hero Header */}
      <LinearGradient
        colors={[COLORS.inkDark, COLORS.inkSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroRow}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Image source={AgriSphereLogo} style={styles.logo} />
              </View>
              <View style={styles.appNameContainer}>
                <Text style={styles.appName}>
                  <Text style={styles.agriText}>Agri</Text>
                  <Text style={styles.sphereText}>Sphere</Text>
                </Text>
                <Text style={styles.heroSub}>Smart Farming</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerIcon}>
                <Ionicons name="hardware-chip-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIcon}
                onPress={() => navigation.navigate('Notifications')}
              >
                <View>
                  <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
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
    paddingBottom: 44,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: { zIndex: 2 },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 4,
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appNameContainer: {
    flexDirection: 'column',
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  agriText: {
    color: COLORS.white,
    fontWeight: '900',
  },
  sphereText: {
    color: COLORS.primaryLight,
    fontWeight: '900',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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