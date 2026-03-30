// screens/Profile/components/FarmDetailsButton.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const FarmDetailsButton = ({ onPress, farmCount = 0 }) => {
  const scaleValue = new Animated.Value(1);
  
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.container, { transform: [{ scale: scaleValue }] }]}>
        <View style={styles.background}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="business" size={24} color="#101010ff" />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>Farm Details</Text>
              <Text style={styles.subtitle}>
                {farmCount > 0 
                  ? `${farmCount} farm${farmCount > 1 ? 's' : ''} registered`
                  : 'Add your farm information'
                }
              </Text>
            </View>
            
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </View>
          
          {/* Status indicator */}
       
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0, // Remove horizontal margin since ProfileSection handles padding
    marginBottom: 8, // Match other menu items spacing
    borderRadius: 12, // Match other menu items border radius
    backgroundColor: 'white', // White background like other menu items
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden', // For the green accent
  },
  background: {
    padding: 16, // Match other menu items padding
    borderLeftWidth: 4, // Green accent on the left
    borderLeftColor: '#0B8457', // Green accent color
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 244, 244, 0.1)', // Light green background
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16, // Match other menu items font size
    fontWeight: '600',
    color: '#1A2332', // Dark text like other menu items
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666', // Gray text like other menu items
  },
  arrowContainer: {
    padding: 4,
  },

});

export default FarmDetailsButton;