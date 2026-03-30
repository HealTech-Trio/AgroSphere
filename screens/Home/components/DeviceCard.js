// screens/Home/components/DeviceCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDevice } from '../../../context/DeviceContext';

const DeviceCard = () => {
  const { connectedDevice, realTimeData, connectionStatus } = useDevice();

  // No device connected - show placeholder
  if (!connectedDevice || connectionStatus !== 'connected') {
    return (
      <View style={styles.placeholderCard}>
        <View style={styles.placeholderIcon}>
          <Ionicons name="hardware-chip-outline" size={48} color="#9B9B9B" />
        </View>
        <Text style={styles.placeholderTitle}>No Device Connected</Text>
        <Text style={styles.placeholderDescription}>
          Connect an IoT device to view real-time sensor data
        </Text>
        <View style={styles.connectionHint}>
          <Ionicons name="information-circle-outline" size={16} color="#0B8457" />
          <Text style={styles.connectionHintText}>
            Go to Settings to connect a device
          </Text>
        </View>
      </View>
    );
  }

  // Device connected - show data
  const getMoistureStatus = (value) => {
    if (!value) return { status: 'Unknown', color: '#9B9B9B', icon: 'help-circle' };
    if (value < 20) return { status: 'Low', color: '#F44336', icon: 'water-off' };
    if (value < 40) return { status: 'Moderate', color: '#FF9800', icon: 'water' };
    return { status: 'Good', color: '#0B8457', icon: 'water' };
  };

  const moistureStatus = getMoistureStatus(realTimeData?.soil);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.deviceInfo}>
          <Ionicons name="hardware-chip" size={20} color="#065A3B" />
          <Text style={styles.cardTitle}>{connectedDevice.name}</Text>
        </View>
        <View style={styles.connectionStatus}>
          <View style={styles.statusDot} />
          <Ionicons name="wifi" size={16} color="#0B8457" />
          <Text style={styles.connectedText}>Wi-Fi</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="thermometer" size={20} color="#FF5722" />
            <Text style={styles.infoValue}>
              {realTimeData?.temperature ? `${realTimeData.temperature.toFixed(1)}°C` : '--'}
            </Text>
            <Text style={styles.infoLabel}>Temperature</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name={moistureStatus.icon} size={20} color={moistureStatus.color} />
            <Text style={[styles.infoValue, { color: moistureStatus.color }]}>
              {realTimeData?.soil ? `${realTimeData.soil}%` : '--'}
            </Text>
            <Text style={styles.infoLabel}>Soil Moisture</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="cloud" size={20} color="#03A9F4" />
            <Text style={styles.infoValue}>
              {realTimeData?.humidity ? `${realTimeData.humidity.toFixed(0)}%` : '--'}
            </Text>
            <Text style={styles.infoLabel}>Humidity</Text>
          </View>
        </View>
        
        <View style={styles.additionalInfo}>
          <View style={styles.batteryInfo}>
            <Ionicons name="flash" size={16} color="#05b51fff" />
            <Text style={styles.batteryText}>
              {realTimeData?.battery ? `${realTimeData.battery}%` : 'On Power'}
            </Text>
          </View>
          <Text style={styles.lastUpdate}>
            {realTimeData?.timestamp ? 
              `Updated ${new Date(realTimeData.timestamp).toLocaleTimeString()}` : 
              'No data'
            }
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  placeholderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  placeholderIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  connectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  connectionHintText: {
    fontSize: 12,
    color: '#0B8457',
    marginLeft: 6,
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065A3B',
    marginLeft: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#0B8457',
  },
  connectedText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#9B9B9B',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#37474F',
  },
  infoLabel: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 2,
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 12,
    color: '#78909C',
    marginLeft: 4,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#78909C',
  },
});

export default DeviceCard;