// screens/Home/alerts/AlertsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../../context/NotificationsContext';

const AlertsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // UPDATED: Use the correct functions from context
  const { alerts, unreadAlertCount, resolveAlert, markAlertAsRead, addNotification } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Use real alerts from context
  const checkCriticalConditions = () => {
    return alerts.filter(alert => !alert.resolved); // Only show unresolved alerts
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    
    // Simulate checking for critical alerts
    setTimeout(() => {
      const newAlerts = checkCriticalConditions();
      setCriticalAlerts(newAlerts);
      setRefreshing(false);

      // Animate when new alerts come in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

    }, 1500);
  }, [fadeAnim]);

  const getSeverityColor = (severity) => {
    const colors = {
      'critical': '#FF5252',
      'high': '#FF9800', 
      'medium': '#FFC107',
      'low': '#0B8457'
    };
    return colors[severity] || '#666';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      'critical': 'alert-circle',
      'high': 'alert',
      'medium': 'information-outline',
      'low': 'check-circle-outline'
    };
    return icons[severity] || 'information-outline';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getActionText = (severity, source) => {
    if (severity === 'critical') return 'Fix Now';
    if (severity === 'high') return 'Address Now';
    if (severity === 'medium') return 'Review';
    return 'Check';
  };

  const handleAlertAction = (alert) => {
    // Mark alert as resolved when action is taken
    resolveAlert(alert.id);
    
    // Optional: Add a notification about the action
    addNotification('Action Taken', `You addressed: ${alert.title}`, 'info', true);
  };

  const handleMarkAsRead = (alert) => {
    // Just mark as read without resolving
    markAlertAsRead(alert.id);
  };

  useEffect(() => {
    // Load real alerts from context
    const initialAlerts = checkCriticalConditions();
    setCriticalAlerts(initialAlerts);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [alerts, fadeAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Emergency Red Gradient for critical alerts */}
      <LinearGradient
        colors={['rgba(255, 82, 82, 0.1)', 'transparent']}
        style={[styles.gradientHeader, { height: insets.top + 160 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#2E2E2E" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Emergency Alerts</Text>
          <Text style={styles.headerSubtitle}>Critical farm conditions</Text>
        </View>

        <View style={styles.headerRight}>
          {criticalAlerts.length > 0 && (
            <View style={styles.alertCountBadge}>
              <Text style={styles.alertCountText}>{criticalAlerts.length}</Text>
            </View>
          )}
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
            colors={['#FF5252']}
            tintColor="#FF5252"
          />
        }
      >
        {/* Emergency Alert Summary */}
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="shield-alert" size={32} color="#FF5252" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>Farm Status Monitor</Text>
            <Text style={styles.summaryText}>
              {criticalAlerts.length === 0 
                ? 'All systems operational ✅' 
                : `${criticalAlerts.length} critical issue${criticalAlerts.length > 1 ? 's' : ''} require attention`
              }
            </Text>
          </View>
        </View>

        {/* Critical Alerts List */}
        {criticalAlerts.length === 0 ? (
          <View style={styles.noAlertsContainer}>
            <MaterialCommunityIcons name="check-circle-outline" size={64} color="#0B8457" />
            <Text style={styles.noAlertsTitle}>No Critical Alerts</Text>
            <Text style={styles.noAlertsText}>
              All farm systems are running normally. Pull down to check for new alerts.
            </Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.alertsSectionTitle}>Active Alerts</Text>
            {criticalAlerts.map((alert, index) => (
              <View key={alert.id || index} style={styles.alertCard}>
                <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(alert.severity) }]} />
                
                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <MaterialCommunityIcons 
                      name={getSeverityIcon(alert.severity)} 
                      size={20} 
                      color={getSeverityColor(alert.severity)} 
                    />
                    <Text style={[styles.alertTitle, { color: getSeverityColor(alert.severity) }]}>
                      {alert.title}
                    </Text>
                    <Text style={styles.alertTime}>{formatTime(alert.timestamp)}</Text>
                  </View>
                  
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: getSeverityColor(alert.severity) }]}
                      onPress={() => handleAlertAction(alert)}
                    >
                      <Text style={styles.actionButtonText}>{getActionText(alert.severity, alert.source)}</Text>
                    </TouchableOpacity>
                    
                    {!alert.read && (
                      <TouchableOpacity 
                        style={styles.markReadButton}
                        onPress={() => handleMarkAsRead(alert)}
                      >
                        <Text style={styles.markReadText}>Mark Read</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('DeviceManagement')}
            >
              <MaterialCommunityIcons name="cog" size={24} color="#666" />
              <Text style={styles.quickActionText}>System Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <MaterialCommunityIcons name="tools" size={24} color="#666" />
              <Text style={styles.quickActionText}>Maintenance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <MaterialCommunityIcons name="phone" size={24} color="#666" />
              <Text style={styles.quickActionText}>Emergency Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  gradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCountBadge: {
    backgroundColor: '#FF5252',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryContent: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  noAlertsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noAlertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B8457',
    marginTop: 16,
    marginBottom: 8,
  },
  noAlertsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  alertsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  severityIndicator: {
    width: 6,
    backgroundColor: '#FF5252',
  },
  alertContent: {
    flex: 1,
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  markReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#999',
  },
  markReadText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  quickActionsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    padding: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AlertsScreen;