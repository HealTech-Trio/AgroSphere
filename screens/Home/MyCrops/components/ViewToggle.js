// screens/MyCrops/components/ViewToggle.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ViewToggle = ({ currentView, onViewChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.toggleButton,
          currentView === 'list' && styles.toggleButtonActive
        ]}
        onPress={() => onViewChange('list')}
      >
        <Ionicons 
          name="list" 
          size={18} // Reduced from 20
          color={currentView === 'list' ? '#FFFFFF' : '#0B8457'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.toggleButton,
          currentView === 'grid' && styles.toggleButtonActive
        ]}
        onPress={() => onViewChange('grid')}
      >
        <Ionicons 
          name="grid" 
          size={18} // Reduced from 20
          color={currentView === 'grid' ? '#FFFFFF' : '#0B8457'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10, // Reduced from 12
    padding: 3, // Reduced from 4
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Reduced from 2
    shadowOpacity: 0.04,
    shadowRadius: 4, // Reduced from 8
    elevation: 1, // Reduced from 2
  },
  toggleButton: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
    borderRadius: 8, // Reduced from 10
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#0B8457',
  },
});

export default ViewToggle;