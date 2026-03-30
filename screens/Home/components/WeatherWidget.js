// screens/Home/components/WeatherWidget.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, firestore } from '../../../firebase';
import { collection, query, where, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { fetchWeatherSummary } from '../../../services/weatherService';

const WeatherWidget = () => {
  const navigation = useNavigation();
  const [primaryFarm, setPrimaryFarm] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's primary farm
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribeUser = null;
    let unsubscribeFarms = null;

    const setupSubscriptions = async () => {
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        
        unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const primaryFarmId = userData.primaryFarmId;

            if (primaryFarmId) {
              // Clean up previous farm subscription
              if (unsubscribeFarms) {
                unsubscribeFarms();
              }

              const farmsQuery = query(
                collection(firestore, 'users', user.uid, 'farms'),
                where('__name__', '==', primaryFarmId)
              );

              unsubscribeFarms = onSnapshot(farmsQuery, (farmsSnapshot) => {
                if (!farmsSnapshot.empty) {
                  const farmData = {
                    id: farmsSnapshot.docs[0].id,
                    ...farmsSnapshot.docs[0].data()
                  };
                  setPrimaryFarm(farmData);
                  if (farmData.location) {
                    fetchWeatherSummaryData(farmData.location);
                  } else {
                    setLoading(false);
                  }
                } else {
                  // If primary farm not found, get the first farm
                  fetchFirstFarm();
                }
              });
            } else {
              // No primary farm ID, get first farm
              fetchFirstFarm();
            }
          } else {
            setLoading(false);
          }
        });

      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        setError('Failed to load farm data');
        setLoading(false);
      }
    };

    const fetchFirstFarm = async () => {
      try {
        const farmsQuery = query(
          collection(firestore, 'users', user.uid, 'farms')
        );
        
        const farmsSnapshot = await getDocs(farmsQuery);
        if (!farmsSnapshot.empty) {
          const firstFarm = {
            id: farmsSnapshot.docs[0].id,
            ...farmsSnapshot.docs[0].data()
          };
          setPrimaryFarm(firstFarm);
          if (firstFarm.location) {
            fetchWeatherSummaryData(firstFarm.location);
          } else {
            setLoading(false);
          }
        } else {
          // No farms at all
          setPrimaryFarm(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching first farm:', error);
        setError('Failed to load farm data');
        setLoading(false);
      }
    };

    setupSubscriptions();

    // Cleanup function
    return () => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }
      if (unsubscribeFarms) {
        unsubscribeFarms();
      }
    };
  }, []);

  const fetchWeatherSummaryData = async (location) => {
    try {
      setLoading(true);
      setError(null);
      const weatherSummary = await fetchWeatherSummary(location);
      setWeatherData(weatherSummary);
    } catch (error) {
      console.error('Error fetching weather summary:', error);
      setError('Failed to load weather data');
      // Fallback to mock data if API fails
      setWeatherData({
        temperature: 26,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        rainChance: 30,
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getWeatherColor = (condition) => {
    const conditionColors = {
      'Clear': '#FFB74D',
      'Clouds': '#78909C',
      'Rain': '#42A5F5',
      'Drizzle': '#42A5F5',
      'Thunderstorm': '#7E57C2',
      'Snow': '#90CAF9',
    };
    return conditionColors[condition] || '#0B8457';
  };

  const handlePress = () => {
    navigation.navigate('Weather'); // This will now work properly
  };

  if (loading) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <LinearGradient
          colors={['rgba(46, 196, 182, 0.08)', 'rgba(11, 132, 87, 0.04)']}
          style={styles.weatherCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.weatherHeader}>
            <View style={styles.weatherLeft}>
              <Text style={styles.temperature}>--°C</Text>
              <Text style={styles.weatherCondition}>Loading weather...</Text>
              <Text style={styles.location}>
                {primaryFarm?.location || 'Fetching data...'}
              </Text>
            </View>
            <View style={styles.weatherIcon}>
              <MaterialCommunityIcons name="weather-cloudy" size={64} color="#E0E0E0" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (!primaryFarm) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <LinearGradient
          colors={['rgba(46, 196, 182, 0.08)', 'rgba(11, 132, 87, 0.04)']}
          style={styles.weatherCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.weatherHeader}>
            <View style={styles.weatherLeft}>
              <Text style={styles.temperature}>Add Farm</Text>
              <Text style={styles.weatherCondition}>No farms added yet</Text>
              <Text style={styles.location}>Tap to manage farms</Text>
            </View>
            <View style={styles.weatherIcon}>
              <MaterialCommunityIcons name="farm" size={64} color="#E0E0E0" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <LinearGradient
        colors={['rgba(46, 196, 182, 0.08)', 'rgba(11, 132, 87, 0.04)']}
        style={styles.weatherCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.weatherHeader}>
          <View style={styles.weatherLeft}>
            <Text style={styles.temperature}>
              {weatherData?.temperature || '--'}°C
            </Text>
            <Text style={[styles.weatherCondition, { color: getWeatherColor(weatherData?.condition) }]}>
              {weatherData?.condition || 'No data'}
            </Text>
            <Text style={styles.location}>
              {primaryFarm.location || primaryFarm.name}
            </Text>
            {primaryFarm.cropType && (
              <Text style={styles.cropType}>
                {primaryFarm.cropType}
              </Text>
            )}
          </View>
          <View style={styles.weatherIcon}>
            <MaterialCommunityIcons 
              name={getWeatherIcon(weatherData?.condition)} 
              size={64} 
              color={getWeatherColor(weatherData?.condition)} 
            />
          </View>
        </View>
        
        <View style={styles.weatherDetails}>
          <View style={styles.weatherDetail}>
            <MaterialCommunityIcons name="water-percent" size={20} color="#9B9B9B" />
            <Text style={styles.detailValue}>{weatherData?.humidity || '--'}%</Text>
            <Text style={styles.detailLabel}>Humidity</Text>
          </View>
          
          <View style={styles.weatherDetail}>
            <MaterialCommunityIcons name="weather-windy" size={20} color="#9B9B9B" />
            <Text style={styles.detailValue}>{weatherData?.windSpeed || '--'} km/h</Text>
            <Text style={styles.detailLabel}>Wind</Text>
          </View>
          
          <View style={styles.weatherDetail}>
            <MaterialCommunityIcons name="weather-rainy" size={20} color="#9B9B9B" />
            <Text style={styles.detailValue}>{weatherData?.rainChance || '--'}%</Text>
            <Text style={styles.detailLabel}>Rain</Text>
          </View>
          
          <View style={styles.weatherDetail}>
            <MaterialCommunityIcons 
              name="arrow-right" 
              size={20} 
              color="#0B8457" 
            />
            <Text style={[styles.detailValue, { color: '#0B8457' }]}>View</Text>
            <Text style={styles.detailLabel}>Full Report</Text>
          </View>
        </View>

        {/* Quick status indicator */}
        {weatherData && (
          <View style={styles.quickStatus}>
            <View style={styles.statusIndicator}>
              <MaterialCommunityIcons 
                name={weatherData.rainChance > 50 ? "alert-circle" : "check-circle"} 
                size={16} 
                color={weatherData.rainChance > 50 ? "#FFA500" : "#0B8457"} 
              />
              <Text style={[
                styles.statusText,
                { color: weatherData.rainChance > 50 ? "#FFA500" : "#0B8457" }
              ]}>
                {weatherData.rainChance > 50 ? "Rain expected" : "Good conditions"}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  weatherCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 26,
    backgroundColor: 'aliceblue',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 6,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherLeft: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A2332',
  },
  weatherCondition: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: '#9B9B9B',
    marginTop: 4,
  },
  cropType: {
    fontSize: 11,
    color: '#0B8457',
    fontWeight: '500',
    marginTop: 2,
    fontStyle: 'italic',
  },
  weatherIcon: {
    opacity: 0.8,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(155, 155, 155, 0.15)',
  },
  weatherDetail: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: '#9B9B9B',
    marginTop: 2,
  },
  quickStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(155, 155, 155, 0.1)',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default WeatherWidget;