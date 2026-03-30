import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ScheduledTasksList = ({ schedules, onEditSchedule, onDeleteSchedule, selectedDate, onAddSchedule }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'planting':
        return 'leaf';
      case 'harvest':
        return 'basket';
      case 'treatment':
        return 'medical';
      case 'irrigation':
        return 'water';
      default:
        return 'calendar';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'planting':
        return '#28a745';
      case 'harvest':
        return '#ffc107';
      case 'treatment':
        return '#dc3545';
      case 'irrigation':
        return '#007bff';
      default:
        return '#6c757d';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderScheduleItem = ({ item }) => (
    <View style={styles.scheduleItem}>
      <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]}>
        <Ionicons name={getTypeIcon(item.type)} size={16} color="#ffffff" />
      </View>
      
      <View style={styles.scheduleContent}>
        <Text style={styles.cropName}>{item.cropName}</Text>
        <Text style={styles.scheduleType}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {formatTime(item.date)}
        </Text>
        {item.notes ? (
          <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
        ) : null}
        
        {item.reminder && (
          <View style={styles.reminderBadge}>
            <Ionicons name="notifications" size={12} color="#6c757d" />
            <Text style={styles.reminderText}>Reminder set</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => onEditSchedule(item)}
          style={styles.actionButton}
        >
          <Ionicons name="create-outline" size={20} color="#6c757d" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onDeleteSchedule(item.id)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (schedules.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={64} color="#dee2e6" />
        <Text style={styles.emptyStateTitle}>No schedules for this date</Text>
        <Text style={styles.emptyStateText}>
          Tap the button below to add your first schedule
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={onAddSchedule}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Schedule</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Schedules for {selectedDate.toLocaleDateString()}
      </Text>
      <FlatList
        data={schedules}
        renderItem={renderScheduleItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5a3c',
    marginBottom: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleContent: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3b45',
    marginBottom: 4,
  },
  scheduleType: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  notes: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reminderText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d5a3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ScheduledTasksList;