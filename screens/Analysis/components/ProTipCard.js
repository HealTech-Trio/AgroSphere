// screens/Analysis/components/ProTipCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

const ProTipCard = () => {
  return (
    <View style={styles.proTipCard}>
      <LinearGradient
        colors={['rgba(11, 132, 87, 0.25)', 'rgba(11, 132, 87, 0.05)']}
        style={styles.proTipGradient}
      >
        <View style={styles.proTipHeader}>
          <View style={styles.proTipIcon}>
            <FontAwesome5 name="lightbulb" size={16} color="#0B8457" />
          </View>
          <Text style={styles.proTipTitle}>AI Pro Tip</Text>
        </View>
        <Text style={styles.proTipText}>
          Combine disease detection with yield prediction for a comprehensive 
          farm health assessment. Upload photos regularly for better AI accuracy.
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  proTipCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'aliceblue',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  proTipGradient: {
    padding: 20,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proTipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  proTipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  proTipText: {
    fontSize: 14,
    color: 'grey',
    lineHeight: 20,
  },
});

export default ProTipCard;