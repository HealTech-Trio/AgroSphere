import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotifications } from '../../../../context/NotificationsContext';

const NotificationDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { deleteNotification } = useNotifications();
  
  // Fix for serialization warning - convert timestamp string back to Date
  const { notification: notificationParam } = route.params;
  const notification = {
    ...notificationParam,
    timestamp: new Date(notificationParam.timestamp)
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert':
        return { name: 'warning', color: '#FF5252', icon: 'alert-circle' };
      case 'warning':
        return { name: 'warning', color: '#FF9800', icon: 'alert' };
      case 'success':
        return { name: 'checkmark-circle', color: '#0B8457', icon: 'check-circle' };
      case 'info':
        return { name: 'information-circle', color: '#2196F3', icon: 'information' };
      case 'reminder':
        return { name: 'calendar', color: '#9C27B0', icon: 'calendar' };
      default:
        return { name: 'notifications', color: '#666', icon: 'bell' };
    }
  };

  const formatDetailedTime = (timestamp) => {
    return timestamp.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionButtons = () => {
    const actions = [];
    
    // Add action buttons based on notification type
    if (notification.type === 'alert' || notification.type === 'warning') {
      actions.push({
        title: 'Take Action',
        icon: 'play-circle',
        color: '#0B8457',
        onPress: () => {
          // Navigate to relevant screen based on notification content
          if (notification.title.includes('Weather')) {
            navigation.navigate('Weather');
          } else if (notification.title.includes('Irrigation') || notification.message.includes('soil moisture')) {
            navigation.navigate('MyCrops');
          } else if (notification.title.includes('Device')) {
            navigation.navigate('Home');
          }
        }
      });
    }
    
    actions.push({
      title: 'Delete',
      icon: 'trash-outline',
      color: '#FF5252',
      onPress: handleDelete
    });

    return actions;
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteNotification(notification.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const typeIcon = getTypeIcon(notification.type);
  const actionButtons = getActionButtons();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header Gradient */}
      <LinearGradient
        colors={['rgba(11, 132, 87, 0.15)', 'transparent']}
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
          <Text style={styles.headerTitle}>Notification Details</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Header */}
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${typeIcon.color}15` }]}>
            <MaterialCommunityIcons 
              name={typeIcon.icon} 
              size={32} 
              color={typeIcon.color} 
            />
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationTime}>
              {formatDetailedTime(notification.timestamp)}
            </Text>
          </View>
        </View>

        {/* Message Card */}
        <View style={styles.messageCard}>
          <Text style={styles.messageLabel}>Message</Text>
          <Text style={styles.messageText}>{notification.message}</Text>
        </View>

        {/* Additional Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Notification Type</Text>
          <View style={styles.typeBadge}>
            <MaterialCommunityIcons 
              name={typeIcon.icon} 
              size={16} 
              color={typeIcon.color} 
            />
            <Text style={[styles.typeText, { color: typeIcon.color }]}>
              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
            </Text>
          </View>
        </View>

        {/* Status Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot,
              { backgroundColor: notification.read ? '#9B9B9B' : '#0B8457' }
            ]} />
            <Text style={styles.statusText}>
              {notification.read ? 'Read' : 'Unread'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsLabel}>Actions</Text>
          <View style={styles.actionsGrid}>
            {actionButtons.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionButton, { backgroundColor: `${action.color}15` }]}
                onPress={action.onPress}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
                <Text style={[styles.actionText, { color: action.color }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsLabel}>Quick Navigation</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('MyCrops')}
            >
              <MaterialCommunityIcons name="sprout" size={20} color="#0B8457" />
              <Text style={styles.quickActionText}>My Crops</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Weather')}
            >
              <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color="#0B8457" />
              <Text style={styles.quickActionText}>Weather</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Schedule')}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#0B8457" />
              <Text style={styles.quickActionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 14,
    color: '#666',
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 16,
    color: '#1A2332',
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2332',
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 16,
  },
  quickActionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B8457',
  },
});

export default NotificationDetailScreen;