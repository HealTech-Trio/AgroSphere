// screens/Home/components/AISection.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';

const AISection = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>AI Assistant</Text>
      
      <TouchableOpacity style={styles.chatButton}>
        <View style={styles.chatButtonContent}>
          <Ionicons name="chatbubble-ellipses" size={24} color="white" />
          <Text style={styles.chatButtonText}>Chat with AgriSphere AI</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="white" />
      </TouchableOpacity>
      
      <View style={styles.toolsGrid}>
        <TouchableOpacity style={styles.toolItem}>
          <View style={[styles.toolIcon, { backgroundColor: COLORS.primarySoft }]}>
            <Ionicons name="leaf" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.toolText}>Disease Detection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolItem}>
          <View style={[styles.toolIcon, { backgroundColor: COLORS.primarySoft }]}>
            <Ionicons name="analytics" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.toolText}>Yield Prediction</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolItem}>
          <View style={[styles.toolIcon, { backgroundColor: COLORS.primarySoft }]}>
            <Ionicons name="flask" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.toolText}>Soil Health</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolItem}>
          <View style={[styles.toolIcon, { backgroundColor: COLORS.primarySoft }]}>
            <Ionicons name="water" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.toolText}>Irrigation Optimizer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});

export default AISection;