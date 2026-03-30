import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotifications } from '../../../../context/NotificationsContext';
import { useNavigation } from '@react-navigation/native';
import { 
  fontSizes,spacing,moderateScale, verticalScale,isIOS,isAndroid } from '../../../../utils/responsive';

const NotificationItem = ({ notification, isLast }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigation = useNavigation();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert':
        return { name: 'warning', color: '#FF5252', bgColor: '#FFEBEE' };
      case 'warning':
        return { name: 'warning', color: '#FF9800', bgColor: '#FFF3E0' };
      case 'success':
        return { name: 'checkmark-circle', color: '#0B8457', bgColor: '#E8F5E8' };
      case 'info':
        return { name: 'information-circle', color: '#2196F3', bgColor: '#E3F2FD' };
      case 'reminder':
        return { name: 'calendar', color: '#9C27B0', bgColor: '#F3E5F5' };
      default:
        return { name: 'notifications', color: '#666', bgColor: '#F5F5F5' };
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const handleView = () => {
    // Mark as read when viewed
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to notification details screen - FIX SERIALIZATION
    navigation.navigate('NotificationDetail', { 
      notification: {
        ...notification,
        timestamp: notification.timestamp.toISOString() // Convert to string for serialization
      }
    });
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
          onPress: () => deleteNotification(notification.id)
        }
      ]
    );
  };

  const typeIcon = getTypeIcon(notification.type);

  return (
    <View style={[styles.container, !isLast && styles.borderBottom]}>
      <View style={[
        styles.notificationCard,
        !notification.read && styles.unreadCard
      ]}>
        {/* Unread indicator */}
        {!notification.read && <View style={styles.unreadIndicator} />}

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: typeIcon.bgColor }]}>
          <Ionicons 
            name={typeIcon.name} 
            size={moderateScale(20)} 
            color={typeIcon.color} 
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.time}>
            {formatTime(notification.timestamp)}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={handleView}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons 
              name="trash-outline" 
              size={moderateScale(18)} 
              color="#FF5252" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    paddingLeft: spacing.large,
    backgroundColor: 'white',
    minHeight: verticalScale(80),
  },
  unreadCard: {
    backgroundColor: '#F8FDF8',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: moderateScale(4),
    backgroundColor: '#0B8457',
    borderTopRightRadius: moderateScale(2),
    borderBottomRightRadius: moderateScale(2),
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  content: {
    flex: 1,
    marginRight: spacing.medium,
  },
  title: {
    fontSize: fontSizes.large,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: spacing.tiny,
  },
  message: {
    fontSize: fontSizes.medium,
    color: '#666',
    lineHeight: moderateScale(20),
    marginBottom: spacing.tiny,
  },
  time: {
    fontSize: fontSizes.small,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  viewButton: {
    backgroundColor: '#0B8457',
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny,
    borderRadius: moderateScale(8),
    ...(isIOS && {
      shadowColor: '#0B8457',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    }),
    ...(isAndroid && {
      elevation: 2,
    }),
  },
  viewButtonText: {
    color: 'white',
    fontSize: fontSizes.small,
    fontWeight: '600',
  },
  deleteButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    ...(isIOS && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
    ...(isAndroid && {
      elevation: 1,
    }),
  },
});

export default NotificationItem;