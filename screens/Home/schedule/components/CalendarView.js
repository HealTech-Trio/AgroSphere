import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CalendarView = ({ selectedDate, onDateSelect, schedules }) => {
  const getMarkedDates = () => {
    const marked = {};
    
    schedules.forEach(schedule => {
      const dateStr = new Date(schedule.date).toISOString().split('T')[0];
      marked[dateStr] = {
        marked: true,
        dotColor: schedule.type === 'planting' ? '#28a745' : 
                  schedule.type === 'harvest' ? '#ffc107' : 
                  schedule.type === 'treatment' ? '#dc3545' : '#007bff',
        selected: dateStr === selectedDate.toISOString().split('T')[0],
        selectedColor: '#0B8457',
        selectedTextColor: '#ffffff'
      };
    });

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    if (!marked[selectedDateStr]) {
      marked[selectedDateStr] = { 
        selected: true, 
        selectedColor: '#0B8457',
        selectedTextColor: '#ffffff'
      };
    }

    return marked;
  };

  return (
    <View style={styles.calendarContainer}>
      {/* REMOVED DUPLICATE MONTH HEADER - Calendar component shows its own header */}
      
      {/* Calendar - Takes full available space */}
      <View style={styles.calendarWrapper}>
        <Calendar
          current={selectedDate.toISOString().split('T')[0]}
          onDayPress={(day) => {
            onDateSelect(new Date(day.timestamp));
          }}
          markedDates={getMarkedDates()}
          hideExtraDays={true}
          // Enable the calendar's built-in header
          showMonthControls={true}
          enableSwipeMonths={true}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#0B8457',
            selectedDayBackgroundColor: '#0B8457',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#0B8457',
            dayTextColor: '#2d3b45',
            textDisabledColor: '#d9e1e8',
            dotColor: '#0B8457',
            selectedDotColor: '#ffffff',
            arrowColor: '#0B8457',
            monthTextColor: '#0B8457',
            textDayFontWeight: '500',
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
            'stylesheet.calendar.header': {
              header: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                alignSelf: 'center',
                marginBottom: 10,
                paddingHorizontal: 10,
              },
              monthText: {
                fontSize: 18,
                fontWeight: '700',
                color: '#0B8457',
                margin: 10,
              },
              week: {
                marginTop: 10,
                marginBottom: 5,
                flexDirection: 'row',
                justifyContent: 'space-around',
                borderBottomWidth: 1,
                borderBottomColor: '#E2E8F0',
                paddingBottom: 10,
              }
            }
          }}
          style={styles.calendar}
        />
      </View>
      
      {/* Legend - Moved closer to calendar */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#28a745' }]} />
          <Text style={styles.legendText}>Planting</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ffc107' }]} />
          <Text style={styles.legendText}>Harvest</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#dc3545' }]} />
          <Text style={styles.legendText}>Treatment</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8, // Reduced top margin to push calendar up
    marginBottom: 16,
    borderRadius: 16,
    padding: 16, // Reduced padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarWrapper: {
    flex: 1,
    justifyContent: 'flex-start', // Push content to top
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16, // Reduced margin
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
  },
});

export default CalendarView;