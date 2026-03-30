import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SchedulesListView = ({ 
  schedules, 
  onEditSchedule, 
  onDeleteSchedule, 
  selectedDate,
  onAddSchedule,
  showDateHeader = true
}) => {
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullDate: date
    };
  };

  const renderScheduleItem = ({ item }) => {
    const { time } = formatDateTime(item.date);
    
    return (
      <View style={styles.scheduleItem}>
        <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]}>
          <Ionicons name={getTypeIcon(item.type)} size={18} color="#ffffff" />
        </View>
        
        <View style={styles.scheduleContent}>
          <Text style={styles.cropName}>{item.cropName}</Text>
          <Text style={styles.scheduleType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {time}
          </Text>
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
          ) : null}
          
          {item.reminder && (
            <View style={styles.reminderBadge}>
              <Ionicons name="notifications" size={12} color="#2d5a3c" />
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
  };

  if (schedules.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="calendar-outline" size={80} color="#e9ecef" />
        </View>
        <Text style={styles.emptyStateTitle}>
          {showDateHeader ? 'No schedules for today' : 'No schedules yet'}
        </Text>
        <Text style={styles.emptyStateText}>
          {showDateHeader 
            ? `You don't have any schedules for ${selectedDate.toLocaleDateString()}`
            : 'Start planning your crop activities by adding your first schedule'
          }
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
      {showDateHeader && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Schedules for {selectedDate.toLocaleDateString()}
          </Text>
          <Text style={styles.scheduleCount}>
            {schedules.length} {schedules.length === 1 ? 'schedule' : 'schedules'}
          </Text>
        </View>
      )}
      
      <FlatList
        data={schedules}
        renderItem={renderScheduleItem}
        keyExtractor={item => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d5a3c',
  },
  scheduleCount: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 20,

  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2d5a3c',
  },
  typeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    lineHeight: 18,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  reminderText: {
    fontSize: 11,
    color: '#2d5a3c',
    fontWeight: '500',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d5a3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d5a3c',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2d5a3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SchedulesListView;