// screens/Weather/WeatherScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, firestore } from '../../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { fetchWeatherData } from '../../services/weatherService';
import { useNotifications } from '../../context/NotificationsContext';

// FIX: Module-level state to persist across component instances
let persistentWeatherState = {
  previousData: null,
  hasNotified: {
    highTemp: false,
    lowTemp: false,
    heavyRain: false,
    strongWind: false,
    highHumidity: false,
    storm: false
  }
};

const WeatherScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { addWeatherAlert, addCriticalAlert, generateWeatherAlertsFromData } = useNotifications();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [showFarmSelector, setShowFarmSelector] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FIX: Use refs that persist across re-renders
  const notificationStateRef = useRef({ ...persistentWeatherState });

  // Fetch user's farms
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const farmsQuery = query(
      collection(firestore, 'users', user.uid, 'farms')
    );

    const unsubscribe = onSnapshot(farmsQuery, (snapshot) => {
      const farmsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFarms(farmsData);
      
      // Auto-select first farm if none selected
      if (farmsData.length > 0 && !selectedFarm) {
        setSelectedFarm(farmsData[0]);
        fetchRealWeatherData(farmsData[0].location);
      }
    });

    return unsubscribe;
  }, []);

  // FIX: Check if weather data has significantly changed
  const hasWeatherChanged = (newData, oldData) => {
    if (!oldData) return true; // First time, always trigger
    
    const significantChanges = {
      temperature: Math.abs(newData.temperature - oldData.temperature) >= 2, // 2°C change
      condition: newData.condition !== oldData.condition,
      windSpeed: Math.abs(newData.windSpeed - oldData.windSpeed) >= 10, // 10 km/h change
      precipitation: Math.abs(newData.precipitation - oldData.precipitation) >= 10, // 10mm change
      humidity: Math.abs(newData.humidity - oldData.humidity) >= 10, // 10% change
    };

    return Object.values(significantChanges).some(change => change);
  };

  // FIX: Enhanced temperature alert system with change detection
  const checkTemperatureAlerts = (weatherData) => {
    if (!weatherData) return;

    const { temperature, condition, windSpeed, precipitation, humidity } = weatherData;
    const state = notificationStateRef.current;

    // Check if weather data has significantly changed
    const weatherChanged = hasWeatherChanged(weatherData, state.previousData);
    
    if (!weatherChanged) {
      console.log('DEBUG: Weather data unchanged, skipping alert check');
      return;
    }

    console.log('DEBUG: Weather data changed, checking alerts');

    // Update previous data
    state.previousData = { ...weatherData };

    // NEW: Use the advanced weather alert generator for AlertsScreen
    if (generateWeatherAlertsFromData) {
      generateWeatherAlertsFromData(weatherData);
    }

    // KEEP EXISTING: Legacy notification system for NotificationsScreen
    if (temperature > 28 && !state.hasNotified.highTemp) {
      console.log('DEBUG: Sending high temperature notification');
      
      // EXISTING: Goes to Notifications
      addWeatherAlert(
        `High temperature warning: ${temperature}°C. Consider shading and extra irrigation for your crops.`,
        'warning'
      );
      
      // NEW: Also create alert for AlertsScreen
      if (addCriticalAlert) {
        addCriticalAlert(
          'High Temperature Warning',
          `Temperature at ${temperature}°C. Consider shading and extra irrigation for heat-sensitive crops.`,
          'high',
          'weather'
        );
      }
      
      state.hasNotified.highTemp = true;
      state.hasNotified.lowTemp = false;
    } 
    else if (temperature < 10 && !state.hasNotified.lowTemp) {
      console.log('DEBUG: Sending low temperature notification');
      
      // EXISTING: Goes to Notifications
      addWeatherAlert(
        `Low temperature alert: ${temperature}°C. Protect sensitive crops from cold damage.`,
        'warning'
      );
      
      // NEW: Also create alert for AlertsScreen
      if (addCriticalAlert) {
        addCriticalAlert(
          'Low Temperature Alert',
          `Temperature at ${temperature}°C. Protect sensitive crops from cold damage and frost.`,
          'high',
          'weather'
        );
      }
      
      state.hasNotified.lowTemp = true;
      state.hasNotified.highTemp = false;
    }
    // Reset flags when temperature returns to normal range
    else if (temperature >= 10 && temperature <= 28) {
      if (state.hasNotified.highTemp || state.hasNotified.lowTemp) {
        console.log('DEBUG: Temperature returned to normal, resetting notification state');
      }
      state.hasNotified.highTemp = false;
      state.hasNotified.lowTemp = false;
    }

    // NEW: Additional alert conditions for other extreme weather
    if (addCriticalAlert) {
      // Heavy rain alerts
      if (precipitation > 50 && !state.hasNotified.heavyRain) {
        console.log('DEBUG: Sending heavy rain notification');
        addCriticalAlert(
          'Heavy Rain Warning',
          `Heavy rainfall (${precipitation}mm) expected. Risk of flooding and soil erosion.`,
          'critical',
          'weather'
        );
        state.hasNotified.heavyRain = true;
      } else if (precipitation <= 50 && state.hasNotified.heavyRain) {
        console.log('DEBUG: Rain level normalized, resetting heavy rain notification');
        state.hasNotified.heavyRain = false;
      }
      
      // Strong wind alerts
      if (windSpeed > 50 && !state.hasNotified.strongWind) {
        console.log('DEBUG: Sending strong wind notification');
        addCriticalAlert(
          'Storm Warning',
          `Very strong winds (${windSpeed} km/h). Secure equipment and structures.`,
          'critical',
          'weather'
        );
        state.hasNotified.strongWind = true;
      } else if (windSpeed <= 50 && state.hasNotified.strongWind) {
        console.log('DEBUG: Wind speed normalized, resetting strong wind notification');
        state.hasNotified.strongWind = false;
      }
      
      // Extreme humidity alerts
      if (humidity > 90 && !state.hasNotified.highHumidity) {
        console.log('DEBUG: Sending high humidity notification');
        addCriticalAlert(
          'High Humidity Alert',
          `Very high humidity (${humidity}%). High risk of fungal diseases.`,
          'high',
          'weather'
        );
        state.hasNotified.highHumidity = true;
      } else if (humidity <= 90 && state.hasNotified.highHumidity) {
        console.log('DEBUG: Humidity normalized, resetting high humidity notification');
        state.hasNotified.highHumidity = false;
      }
      
      // Storm condition alerts
      if (condition?.toLowerCase().includes('storm') && !state.hasNotified.storm) {
        console.log('DEBUG: Sending storm notification');
        addCriticalAlert(
          'Thunderstorm Alert',
          'Thunderstorms expected. Secure equipment and prepare for power outages.',
          'critical',
          'weather'
        );
        state.hasNotified.storm = true;
      } else if (!condition?.toLowerCase().includes('storm') && state.hasNotified.storm) {
        console.log('DEBUG: Storm condition cleared, resetting storm notification');
        state.hasNotified.storm = false;
      }
    }

    // Update persistent state
    persistentWeatherState = { ...state };
  };

  // FIX: Reset notifications when farm changes
  const resetNotificationState = () => {
    notificationStateRef.current = {
      previousData: null,
      hasNotified: {
        highTemp: false,
        lowTemp: false,
        heavyRain: false,
        strongWind: false,
        highHumidity: false,
        storm: false
      }
    };
    persistentWeatherState = { ...notificationStateRef.current };
    console.log('DEBUG: Notification state reset for new farm');
  };

  // Real weather API call - UPDATED TO USE BOTH ALERT SYSTEMS
  const fetchRealWeatherData = async (location) => {
    setLoading(true);
    setError(null);
    try {
      const realWeatherData = await fetchWeatherData(location);
      setWeatherData(realWeatherData);
      
      // UPDATED: Use both alert systems
      if (realWeatherData && realWeatherData.temperature !== undefined) {
        checkTemperatureAlerts(realWeatherData);
      }
      
    } catch (error) {
      setError('Failed to fetch weather data. Please check your location and try again.');
    }
    setLoading(false);
  };

  const handleFarmSelect = (farm) => {
    // FIX: Reset notification state when switching farms
    resetNotificationState();
    setSelectedFarm(farm);
    setShowFarmSelector(false);
    fetchRealWeatherData(farm.location);
  };

  // FIX: Initialize notification state from persistent storage
  useEffect(() => {
    // Restore persistent state when component mounts
    notificationStateRef.current = { ...persistentWeatherState };
    console.log('DEBUG: Notification state restored from persistent storage');
  }, []);

  // FIX: Fetch fresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('WeatherScreen focused - fetching fresh weather data');
      if (selectedFarm) {
        fetchRealWeatherData(selectedFarm.location);
      }
    });

    return unsubscribe;
  }, [navigation, selectedFarm]);

  const getWeatherIcon = (condition) => {
    const conditionIcons = {
      'Clear': 'weather-sunny',
      'Clouds': 'weather-cloudy',
      'Rain': 'weather-rainy',
      'Drizzle': 'weather-rainy',
      'Thunderstorm': 'weather-lightning-rainy',
      'Snow': 'weather-snowy',
      'Mist': 'weather-fog',
      'Smoke': 'weather-fog',
      'Haze': 'weather-fog',
      'Dust': 'weather-fog',
      'Fog': 'weather-fog',
      'Sand': 'weather-fog',
      'Ash': 'weather-fog',
      'Squall': 'weather-windy',
      'Tornado': 'weather-tornado',
    };
    return conditionIcons[condition] || 'weather-partly-cloudy';
  };

  const getUVColor = (uvIndex) => {
    const uvColors = {
      'Low': '#0B8457',
      'Moderate': '#FFA500',
      'High': '#FF6B6B',
      'Very High': '#8B0000',
    };
    return uvColors[uvIndex] || '#0B8457';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.farmSelector}
          onPress={() => setShowFarmSelector(true)}
        >
          <Text style={styles.farmSelectorTitle}>Weather</Text>
          <View style={styles.farmSelectorSubtitle}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.farmSelectorLocation}>
              {selectedFarm?.location || 'Select a farm'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ADD TEMPERATURE ALERT BANNER WHEN EXTREME TEMPERATURES */}
        {weatherData && (weatherData.temperature > 28 || weatherData.temperature < 10) && (
          <View style={[
            styles.tempAlertBanner,
            weatherData.temperature > 28 ? styles.highTempAlert : styles.lowTempAlert
          ]}>
            <MaterialCommunityIcons 
              name={weatherData.temperature > 28 ? "thermometer-high" : "thermometer-low"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.tempAlertText}>
              {weatherData.temperature > 28 
                ? `High Temperature: ${weatherData.temperature}°C` 
                : `Low Temperature: ${weatherData.temperature}°C`
              }
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#FF6B6B" />
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Weather Data Unavailable</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="weather-cloudy" size={64} color="#E0E0E0" />
            <Text style={styles.loadingText}>Loading real weather data...</Text>
          </View>
        ) : weatherData ? (
          <>
            {/* Current Weather Card */}
            <LinearGradient
              colors={['rgba(46, 196, 182, 0.15)', 'rgba(11, 132, 87, 0.08)']}
              style={styles.currentWeatherCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.currentWeatherHeader}>
                <View style={styles.weatherLeft}>
                  <Text style={[
                    styles.temperature,
                    weatherData.temperature > 28 && styles.highTemperature,
                    weatherData.temperature < 10 && styles.lowTemperature
                  ]}>
                    {weatherData.temperature}°C
                  </Text>
                  <Text style={styles.weatherCondition}>{weatherData.condition}</Text>
                  <Text style={styles.farmName}>{selectedFarm?.name}</Text>
                  <Text style={styles.locationName}>{weatherData.locationName}</Text>
                </View>
                <View style={styles.weatherIcon}>
                  <MaterialCommunityIcons 
                    name={getWeatherIcon(weatherData.condition)} 
                    size={80} 
                    color="#0B8457" 
                  />
                </View>
              </View>
              
              <View style={styles.weatherDetails}>
                <View style={styles.weatherDetail}>
                  <MaterialCommunityIcons name="water-percent" size={24} color="#9B9B9B" />
                  <Text style={styles.detailValue}>{weatherData.humidity}%</Text>
                  <Text style={styles.detailLabel}>Humidity</Text>
                </View>
                
                <View style={styles.weatherDetail}>
                  <MaterialCommunityIcons name="weather-windy" size={24} color="#9B9B9B" />
                  <Text style={styles.detailValue}>{weatherData.windSpeed} km/h</Text>
                  <Text style={styles.detailLabel}>Wind</Text>
                </View>
                
                <View style={styles.weatherDetail}>
                  <MaterialCommunityIcons name="weather-rainy" size={24} color="#9B9B9B" />
                  <Text style={styles.detailValue}>{weatherData.rainChance}%</Text>
                  <Text style={styles.detailLabel}>Rain Chance</Text>
                </View>
                
                <View style={styles.weatherDetail}>
                  <MaterialCommunityIcons 
                    name="white-balance-sunny" 
                    size={24} 
                    color={getUVColor(weatherData.uvIndex)} 
                  />
                  <Text style={[styles.detailValue, { color: getUVColor(weatherData.uvIndex) }]}>
                    {weatherData.uvIndex}
                  </Text>
                  <Text style={styles.detailLabel}>UV Index</Text>
                </View>
              </View>
            </LinearGradient>

            {/* 5-Day Forecast */}
            <View style={styles.forecastSection}>
              <Text style={styles.sectionTitle}>5-Day Forecast</Text>
              <View style={styles.forecastList}>
                {weatherData.forecast.map((day, index) => (
                  <View key={index} style={styles.forecastItem}>
                    <Text style={styles.forecastDay}>{day.day}</Text>
                    <MaterialCommunityIcons 
                      name={getWeatherIcon(day.condition)} 
                      size={32} 
                      color="#0B8457" 
                    />
                    <View style={styles.forecastTemps}>
                      <Text style={styles.forecastHigh}>{day.high}°</Text>
                      <Text style={styles.forecastLow}>{day.low}°</Text>
                    </View>
                    <Text style={styles.forecastCondition}>{day.condition}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Weather Alerts */}
            <View style={styles.alertsSection}>
              <Text style={styles.sectionTitle}>Weather Alerts</Text>
              <View style={styles.alertCard}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#FFA500" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>No Active Alerts</Text>
                  <Text style={styles.alertText}>
                    No severe weather alerts for {weatherData.locationName}
                  </Text>
                </View>
              </View>
            </View>

            {/* Farming Recommendations */}
            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>Farming Recommendations</Text>
              <View style={styles.recommendationCard}>
                <MaterialCommunityIcons name="sprout" size={24} color="#0B8457" />
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>Optimal Planting Conditions</Text>
                  <Text style={styles.recommendationText}>
                    Current weather is ideal for planting {selectedFarm?.cropType || 'crops'}. 
                    Consider irrigation if no rain expected in the next 48 hours.
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <MaterialCommunityIcons name="weather-cloudy" size={64} color="#E0E0E0" />
            <Text style={styles.noDataTitle}>No Weather Data</Text>
            <Text style={styles.noDataText}>
              Select a farm to view weather information
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Farm Selection Modal */}
      <Modal
        visible={showFarmSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFarmSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Farm</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowFarmSelector(false)}
            >
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={farms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.farmItem,
                  selectedFarm?.id === item.id && styles.selectedFarmItem
                ]}
                onPress={() => handleFarmSelect(item)}
              >
                <View style={styles.farmItemContent}>
                  <MaterialCommunityIcons name="home-group" size={24} color="#0B8457" />
                  <View style={styles.farmItemInfo}>
                    <Text style={styles.farmItemName}>{item.name}</Text>
                    <Text style={styles.farmItemLocation}>{item.location}</Text>
                  </View>
                </View>
                {selectedFarm?.id === item.id && (
                  <Ionicons name="checkmark" size={20} color="#0B8457" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.noFarmsContainer}>
                <MaterialCommunityIcons name="farm" size={64} color="#E0E0E0" />
                <Text style={styles.noFarmsText}>No farms added yet</Text>
                <Text style={styles.noFarmsSubtext}>
                  Add farms in the Farm Details section to view weather information
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

// ... (keep ALL your existing styles EXACTLY the same)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  tempAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  highTempAlert: {
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
  },
  lowTempAlert: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
  },
  tempAlertText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  highTemperature: {
    color: '#FF5722',
  },
  lowTemperature: {
    color: '#2196F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  farmSelector: {
    flex: 1,
    alignItems: 'center',
  },
  farmSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  farmSelectorSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  farmSelectorLocation: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 4,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9B9B9B',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
  },
  currentWeatherCard: {
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  currentWeatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  weatherLeft: {
    flex: 1,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A2332',
  },
  weatherCondition: {
    fontSize: 18,
    color: '#0B8457',
    fontWeight: '500',
    marginTop: 4,
  },
  farmName: {
    fontSize: 14,
    color: '#9B9B9B',
    marginTop: 6,
  },
  weatherIcon: {
    opacity: 0.9,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(155, 155, 155, 0.15)',
  },
  weatherDetail: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9B9B9B',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 16,
    marginHorizontal: 20,
  },
  forecastSection: {
    marginBottom: 24,
  },
  forecastList: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  forecastDay: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A2332',
    width: 80,
  },
  forecastTemps: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  forecastHigh: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginRight: 8,
  },
  forecastLow: {
    fontSize: 14,
    color: '#9B9B9B',
  },
  forecastCondition: {
    fontSize: 14,
    color: '#9B9B9B',
    width: 100,
    textAlign: 'right',
  },
  alertsSection: {
    marginBottom: 24,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#9B9B9B',
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#9B9B9B',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  modalCloseButton: {
    padding: 4,
  },
  farmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedFarmItem: {
    backgroundColor: 'rgba(11, 132, 87, 0.05)',
  },
  farmItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  farmItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  farmItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A2332',
    marginBottom: 2,
  },
  farmItemLocation: {
    fontSize: 14,
    color: '#9B9B9B',
  },
  noFarmsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noFarmsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 16,
    marginBottom: 8,
  },
  noFarmsSubtext: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorContent: {
    flex: 1,
    marginLeft: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    lineHeight: 18,
  },
  locationName: {
    fontSize: 12,
    color: '#0B8457',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default WeatherScreen;