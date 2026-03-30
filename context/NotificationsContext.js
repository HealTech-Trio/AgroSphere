import React, { createContext, useState, useContext, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { Platform, Dimensions, StatusBar, View, Text, Image } from 'react-native';
import { isIOS, isAndroid, fontSizes, spacing, moderateScale, verticalScale } from '../utils/responsive';
import AgriSphereLogo from '../assets/Images/Logo_c.png';

// Firebase imports for loading user preferences
import { auth, firestore } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

// Custom Toast Config - WITH LOGO RESTORED
const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={[
      styles.toastContainer,
      styles.successToast
    ]}>
      <View style={styles.toastHeader}>
        <Image 
          source={AgriSphereLogo} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.toastTitle}>{text1}</Text>
      </View>
      <Text style={styles.toastMessage}>{text2}</Text>
    </View>
  ),
  
  error: ({ text1, text2 }) => (
    <View style={[
      styles.toastContainer,
      styles.errorToast
    ]}>
      <View style={styles.toastHeader}>
        <Image 
          source={AgriSphereLogo} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.toastTitle}>{text1}</Text>
      </View>
      <Text style={styles.toastMessage}>{text2}</Text>
    </View>
  ),
  
  info: ({ text1, text2 }) => (
    <View style={[
      styles.toastContainer,
      styles.infoToast
    ]}>
      <View style={styles.toastHeader}>
        <Image 
          source={AgriSphereLogo} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.toastTitle}>{text1}</Text>
      </View>
      <Text style={styles.toastMessage}>{text2}</Text>
    </View>
  ),
};

const styles = {
  toastContainer: {
    minHeight: verticalScale(100),
    width: '95%',
    backgroundColor: 'white',
    borderRadius: moderateScale(16),
    padding: spacing.medium,
    marginHorizontal: spacing.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderLeftWidth: moderateScale(6),
  },
  successToast: {
    borderLeftColor: '#0B8457',
  },
  errorToast: {
    borderLeftColor: '#FF5252',
  },
  infoToast: {
    borderLeftColor: '#0B8457',
  },
  toastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  logo: {
    width: moderateScale(32),
    height: moderateScale(32),
    marginRight: spacing.small,
    borderRadius: moderateScale(6),
  },
  toastTitle: {
    fontSize: fontSizes.xlarge,
    fontWeight: '700',
    color: '#1A2332',
    flex: 1,
  },
  toastMessage: {
    fontSize: fontSizes.large,
    color: '#666',
    lineHeight: moderateScale(22),
  },
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Irrigation Alert',
      message: 'Field A soil moisture is below optimal level (15%)',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: 'alert',
      read: false,
    },
    {
      id: '2', 
      title: 'Weather Update',
      message: 'Rain expected in your area tomorrow. Consider adjusting irrigation schedule.',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      type: 'info',
      read: false,
    }
  ]);

  // NEW: Separate state for critical alerts
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0); // NEW: Separate alert count
  
  // NEW: Add state for notifications enabled/disabled
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load user notification preference from Firebase on app start
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.notificationsEnabled !== undefined) {
              setNotificationsEnabled(userData.notificationsEnabled);
            }
          }
        }
      } catch (error) {
        console.error("Error loading notification preference:", error);
      }
    };

    loadNotificationPreference();
  }, []);

  // Calculate unread counts
  useEffect(() => {
    const generalUnread = notifications.filter(notification => !notification.read).length;
    const alertUnread = alerts.filter(alert => !alert.read).length;
    
    setUnreadCount(generalUnread);
    setUnreadAlertCount(alertUnread); // NEW: Separate alert count
  }, [notifications, alerts]);

  // Clean up toast on unmount
  useEffect(() => {
    return () => {
      Toast.hide();
    };
  }, []);

  const getToastPosition = () => {
    const baseConfig = {
      position: 'top',
      visibilityTime: 6000,
      autoHide: true,
    };

    if (isIOS) {
      return {
        ...baseConfig,
        topOffset: verticalScale(80),
      };
    } else {
      return {
        ...baseConfig,
        topOffset: StatusBar.currentHeight + verticalScale(20),
      };
    }
  };

  // ========== GENERAL NOTIFICATION FUNCTIONS ==========

  const addNotification = (title, message, type = 'info', showPopup = true) => {
    console.log('DEBUG: addNotification called with:', { title, message, type, showPopup, notificationsEnabled });
    
    // Check if notifications are disabled
    if (!notificationsEnabled) {
      console.log('DEBUG: Notifications are disabled - not showing notification');
      return;
    }

    // Create a more unique ID to prevent duplicates
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification = {
      id: uniqueId,
      title,
      message,
      type,
      read: false,
      timestamp: new Date(),
    };

    // Prevent duplicates by checking existing notifications FIRST
    setNotifications(prev => {
      // Check if identical notification already exists in the last 5 seconds
      const isDuplicate = prev.some(notif => 
        notif.title === title && 
        notif.message === message && 
        (Date.now() - notif.timestamp.getTime()) < 5000 // 5 second window
      );
      
      if (isDuplicate) {
        console.log('DEBUG: Duplicate notification prevented');
        return prev;
      }
      
      // Only show toast if not a duplicate AND showPopup is true AND notifications are enabled
      if (showPopup && notificationsEnabled) {
        console.log('DEBUG: Showing toast notification');
        
        let toastType = 'info';
        if (type === 'alert' || type === 'warning') {
          toastType = 'error';
        } else if (type === 'success') {
          toastType = 'success';
        }

        const toastPosition = getToastPosition();
        
        // Use setTimeout to ensure this runs after state update
        setTimeout(() => {
          Toast.show({
            type: toastType,
            text1: title,
            text2: message,
            ...toastPosition,
          });
        }, 100);
      }

      return [newNotification, ...prev];
    });

    console.log('REAL-TIME NOTIFICATION:', { title, message, type, id: uniqueId, enabled: notificationsEnabled });
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // SPECIAL FUNCTION FOR CROP SCHEDULING
  const addCropScheduleNotification = (cropName, date, action = 'scheduled', activityType = 'planting') => {
    // Check if notifications are disabled
    if (!notificationsEnabled) return;

    const actions = {
      'scheduled': 'scheduled for',
      'updated': 'updated for', 
      'deleted': 'deleted for'
    };
    
    const activityNames = {
      'planting': 'planting',
      'irrigation': 'irrigation',
      'fertilizing': 'fertilizing',
      'harvesting': 'harvesting',
      'pruning': 'pruning',
      'spraying': 'spraying'
    };

    const displayActivity = activityNames[activityType] || activityType;

    addNotification(
      '🌱 Farm Activity Scheduled',
      `${cropName} ${displayActivity} ${actions[action]} ${new Date(date).toLocaleDateString()}`,
      'info',
      true
    );
  };

  // SPECIAL FUNCTION FOR WEATHER ALERTS
  const addWeatherAlert = (message, severity = 'warning') => {
    // Check if notifications are disabled
    if (!notificationsEnabled) return;

    addNotification(
      '🌧️ Weather Alert',
      message,
      severity,
      true
    );
  };

  // ========== ALERT-SPECIFIC FUNCTIONS ==========

  // NEW: Separate function for adding critical alerts
  const addCriticalAlert = (title, message, severity = 'high', source = 'system') => {
    // Check if notifications are disabled
    if (!notificationsEnabled) {
      console.log('DEBUG: Notifications are disabled - not showing critical alert');
      return;
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newAlert = {
      id: uniqueId,
      title,
      message,
      severity, // 'critical', 'high', 'medium', 'low'
      source,   // 'system', 'device', 'weather', 'pest'
      read: false,
      timestamp: new Date(),
      resolved: false,
    };

    setAlerts(prev => {
      // Prevent duplicate alerts within 1 minute
      const isDuplicate = prev.some(alert => 
        alert.title === title && 
        alert.message === message && 
        (Date.now() - alert.timestamp.getTime()) < 60000 // 1 minute window for alerts
      );
      
      if (isDuplicate) {
        console.log('DEBUG: Duplicate alert prevented');
        return prev;
      }

      // Show toast for critical and high severity alerts ONLY if notifications are enabled
      if ((severity === 'critical' || severity === 'high') && notificationsEnabled) {
        const toastPosition = getToastPosition();
        
        setTimeout(() => {
          Toast.show({
            type: 'error',
            text1: `🚨 ${title}`,
            text2: message,
            ...toastPosition,
          });
        }, 100);
      }

      return [newAlert, ...prev];
    });

    console.log('CRITICAL ALERT ADDED:', { title, message, severity, id: uniqueId, enabled: notificationsEnabled });
  };

  // NEW: Function to resolve alerts
  const resolveAlert = (alertId) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, resolved: true, read: true }
          : alert
      )
    );
  };

  // NEW: Function to mark alert as read
  const markAlertAsRead = (alertId) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, read: true }
          : alert
      )
    );
  };

  // NEW: Function to get active (unresolved) alerts
  const getActiveAlerts = () => {
    return alerts.filter(alert => !alert.resolved);
  };

  // NEW: Function to generate alerts from sensor data
  const generateAlertsFromSensorData = (sensorData) => {
    if (!notificationsEnabled || !sensorData) return;

    // Soil moisture alerts
    if (sensorData.soil < 20) {
      addCriticalAlert(
        'Critical Soil Moisture',
        `Soil moisture critically low at ${sensorData.soil}%. Immediate irrigation needed.`,
        'critical',
        'sensor'
      );
    } else if (sensorData.soil > 80) {
      addCriticalAlert(
        'Overwatering Alert', 
        `Soil moisture too high at ${sensorData.soil}%. Risk of root rot.`,
        'high',
        'sensor'
      );
    }

    // Temperature alerts
    if (sensorData.temperature > 35) {
      addCriticalAlert(
        'Extreme Temperature',
        `Temperature critically high at ${sensorData.temperature}°C. Plants at risk of heat stress.`,
        'critical',
        'sensor'
      );
    } else if (sensorData.temperature > 30) {
      addCriticalAlert(
        'High Temperature',
        `Temperature high at ${sensorData.temperature}°C. Monitor plant stress.`,
        'high',
        'sensor'
      );
    } else if (sensorData.temperature < 5) {
      addCriticalAlert(
        'Freezing Temperature',
        `Temperature critically low at ${sensorData.temperature}°C. Risk of frost damage.`,
        'critical',
        'sensor'
      );
    }

    // Humidity alerts
    if (sensorData.humidity > 85) {
      addCriticalAlert(
        'High Humidity',
        `Humidity very high at ${sensorData.humidity}%. High risk of fungal diseases.`,
        'high',
        'sensor'
      );
    }
  };

  const generateWeatherAlertsFromData = (weatherData) => {
    if (!notificationsEnabled || !weatherData) return;

    console.log('🌤️ Analyzing weather data for alerts:', weatherData);

    // Temperature Alerts
    if (weatherData.temperature > 35) {
      addCriticalAlert(
        'Extreme Heat Warning',
        `Temperature expected to reach ${weatherData.temperature}°C. Protect crops from heat stress.`,
        'critical',
        'weather'
      );
    } else if (weatherData.temperature > 30) {
      addCriticalAlert(
        'High Temperature Alert',
        `High temperature (${weatherData.temperature}°C) may stress heat-sensitive crops.`,
        'high',
        'weather'
      );
    } else if (weatherData.temperature < 2) {
      addCriticalAlert(
        'Frost Warning',
        `Temperature dropping to ${weatherData.temperature}°C. Risk of frost damage to crops.`,
        'critical',
        'weather'
      );
    } else if (weatherData.temperature < 5) {
      addCriticalAlert(
        'Low Temperature Alert',
        `Cold temperature (${weatherData.temperature}°C). Protect sensitive plants.`,
        'high',
        'weather'
      );
    }

    // Precipitation Alerts
    if (weatherData.precipitation > 50) {
      addCriticalAlert(
        'Heavy Rain Warning',
        `Heavy rainfall (${weatherData.precipitation}mm) expected. Risk of flooding.`,
        'critical',
        'weather'
      );
    } else if (weatherData.precipitation > 25) {
      addCriticalAlert(
        'Rain Alert',
        `Significant rainfall (${weatherData.precipitation}mm) expected. Adjust irrigation.`,
        'medium',
        'weather'
      );
    }

    // Wind Alerts
    if (weatherData.windSpeed > 50) {
      addCriticalAlert(
        'Storm Warning',
        `Very strong winds (${weatherData.windSpeed} km/h). Secure equipment and structures.`,
        'critical',
        'weather'
      );
    } else if (weatherData.windSpeed > 30) {
      addCriticalAlert(
        'Strong Wind Alert',
        `Strong winds (${weatherData.windSpeed} km/h) expected. Protect delicate crops.`,
        'high',
        'weather'
      );
    }

    // Humidity Alerts
    if (weatherData.humidity > 90) {
      addCriticalAlert(
        'High Humidity Alert',
        `Very high humidity (${weatherData.humidity}%). High risk of fungal diseases.`,
        'high',
        'weather'
      );
    } else if (weatherData.humidity < 20) {
      addCriticalAlert(
        'Low Humidity Alert',
        `Very dry conditions (${weatherData.humidity}%). Increase irrigation frequency.`,
        'medium',
        'weather'
      );
    }

    // Special Weather Conditions
    if (weatherData.condition?.toLowerCase().includes('storm')) {
      addCriticalAlert(
        'Thunderstorm Alert',
        'Thunderstorms expected. Secure equipment and prepare for power outages.',
        'critical',
        'weather'
      );
    }

    if (weatherData.condition?.toLowerCase().includes('snow')) {
      addCriticalAlert(
        'Snow Alert',
        'Snow expected. Protect crops and clear structures to prevent damage.',
        'critical',
        'weather'
      );
    }
  };

  const value = {
    // General notifications
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    addCropScheduleNotification,
    addWeatherAlert,
    
    // NEW: Notifications enabled state
    notificationsEnabled,
    setNotificationsEnabled,
    
    // NEW: Alert-specific functions
    alerts: getActiveAlerts(), // Only return active alerts
    unreadAlertCount,         // Separate count for alerts
    addCriticalAlert,
    resolveAlert,
    markAlertAsRead,
    generateAlertsFromSensorData,
    getAllAlerts: () => alerts, // Get all alerts including resolved
    generateWeatherAlertsFromData,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {/* Single Toast component with custom config */}
      <Toast config={toastConfig} />
    </NotificationsContext.Provider>
  );
};