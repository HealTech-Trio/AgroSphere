// screens/MyCrops/components/CropStats.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CropStats = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Crops',
      value: stats?.total || 0,
      icon: 'sprout',
      color: '#0B8457'
    },
    {
      label: 'Early Stage',
      value: stats?.earlyStage || 0,
      icon: 'seed',
      color: '#F59E0B'
    },
    {
      label: 'Late Stage',
      value: stats?.lateStage || 0,
      icon: 'flower',
      color: '#3B82F6'
    },
    {
      label: 'Completed',
      value: stats?.completed || 0,
      icon: 'check-circle',
      color: '#2196F3'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        {statItems.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      
      {/* Total Area Summary Sentence */}
      <View style={styles.areaSummary}>
        <MaterialCommunityIcons name="map-marker-radius" size={16} color="#0B8457" />
        <Text style={styles.areaSummaryText}>
          Total cultivation area: <Text style={styles.areaHighlight}>{stats?.totalArea || '0.00'} hectares</Text> across all farms
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#7B7B7B',
    textAlign: 'center',
  },
  areaSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0B8457',
  },
  areaSummaryText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
  },
  areaHighlight: {
    color: '#0B8457',
    fontWeight: '700',
  },
});

export default CropStats;