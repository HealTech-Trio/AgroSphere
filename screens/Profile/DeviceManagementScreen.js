// screens/Profile/DeviceManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDevice } from '../../context/DeviceContext';

const DeviceManagementScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    connectedDevice,
    pairedDevices,
    discoveredDevices,
    connectionStatus,
    isScanning,
    connectToDevice,
    disconnectDevice,
    removePairedDevice,
    scanForDevices,
    quickScanForDevices,
  } = useDevice();

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleScanDevices = async () => {
    const found = await scanForDevices();
    if (found.length === 0) {
      Alert.alert(
        'No Devices Found',
        'Make sure your ESP8266 devices are:\n• Powered on\n• Connected to the same Wi-Fi network\n• Running the latest firmware'
      );
    }
  };

  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
    setPassword('');
    setShowPasswordModal(true);
  };

  const handleConnectWithPassword = async () => {
    if (!selectedDevice) {
      Alert.alert('No Device Selected', 'Please select a device first');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter the device password');
      return;
    }

    setIsConnecting(true);
    const success = await connectToDevice(selectedDevice, password.trim());
    setIsConnecting(false);
    
    if (success) {
      setShowPasswordModal(false);
      setSelectedDevice(null);
      setPassword('');
      Alert.alert('Success', `Connected to ${selectedDevice.name}`);
    } else {
      Alert.alert(
        'Connection Failed', 
        'Could not connect to the device. Please check:\n• Password is correct\n• Device is online\n• Network connection is stable'
      );
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordModal(false);
    setSelectedDevice(null);
    setPassword('');
  };

  const handleDisconnect = (device) => {
    Alert.alert(
      'Disconnect Device',
      `Disconnect from ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: () => disconnectDevice()
        },
      ]
    );
  };

  const handleRemoveDevice = (device) => {
    Alert.alert(
      'Remove Device',
      `Remove ${device.name} from your paired devices?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removePairedDevice(device.id)
        },
      ]
    );
  };

  const handleQuickConnect = (device) => {
    if (!device.password) {
      setSelectedDevice(device);
      setShowPasswordModal(true);
      Alert.alert(
        'Password Required',
        'Please enter the device password to reconnect'
      );
      return;
    }
    
    Alert.alert(
      'Reconnect Device',
      `Reconnect to ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Connect', 
          onPress: async () => {
            setIsConnecting(true);
            const success = await connectToDevice(device, device.password);
            setIsConnecting(false);
            
            if (success) {
              Alert.alert('Success', `Connected to ${device.name}`);
            } else {
              Alert.alert('Connection Failed', 'Could not reconnect to the device');
            }
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Devices</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Discovery Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover Devices</Text>
            <View style={styles.scanButtonGroup}>
              <TouchableOpacity 
                style={[styles.quickScanButton, isScanning && styles.scanButtonDisabled]}
                onPress={quickScanForDevices}
                disabled={isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color="#0B8457" />
                ) : (
                  <>
                    <Ionicons name="flash" size={14} color="#0B8457" />
                    <Text style={styles.quickScanButtonText}>Quick</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
                onPress={handleScanDevices}
                disabled={isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="scan" size={16} color="white" />
                    <Text style={styles.scanButtonText}>Full Scan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Manual IP Entry */}
          <View style={styles.manualEntryCard}>
            <Text style={styles.manualEntryTitle}>Or enter IP manually:</Text>
            <View style={styles.manualEntryRow}>
              <TextInput
                style={styles.manualIpInput}
                placeholder="192.168.137.71"
                placeholderTextColor="#9B9B9B"
                keyboardType="numbers-and-punctuation"
                onChangeText={(ip) => {
                  if (ip.length > 7) {
                    const manualDevice = {
                      id: 'manual-' + ip.replace(/\./g, '-'),
                      name: 'ESP8266 Device',
                      ip: ip,
                      type: 'ESP8266',
                      wsPort: 81,
                      requiresAuth: true,
                    };
                    handleSelectDevice(manualDevice);
                  }
                }}
              />
            </View>
            <Text style={styles.manualEntryHint}>
              Enter your device's IP address if scan doesn't find it
            </Text>
          </View>

          {isScanning && (
            <View style={styles.scanningCard}>
              <ActivityIndicator size="large" color="#0B8457" />
              <Text style={styles.scanningText}>Scanning for devices on your network...</Text>
            </View>
          )}

          {!isScanning && discoveredDevices.length > 0 && (
            <View style={styles.discoveredDevicesContainer}>
              {discoveredDevices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.discoveredDeviceCard}
                  onPress={() => handleSelectDevice(device)}
                >
                  <View style={styles.deviceInfo}>
                    <Ionicons 
                      name="hardware-chip" 
                      size={24} 
                      color="#0B8457" 
                    />
                    <View style={styles.deviceText}>
                      <Text style={styles.discoveredDeviceName}>{device.name}</Text>
                      <Text style={styles.discoveredDeviceIp}>{device.ip}</Text>
                    </View>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#0B8457" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isScanning && discoveredDevices.length === 0 && (
            <View style={styles.helpCard}>
              <Ionicons name="information-circle-outline" size={20} color="#0B8457" />
              <Text style={styles.helpText}>
                Tap "Scan" to discover ESP8266 devices on your Wi-Fi network
              </Text>
            </View>
          )}
        </View>

        {/* Currently Connected Device */}
        {connectedDevice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Currently Connected</Text>
            <View style={styles.connectedDeviceCard}>
              <View style={styles.deviceHeader}>
                <View style={styles.deviceInfo}>
                  <Ionicons name="hardware-chip" size={24} color="#0B8457" />
                  <View style={styles.deviceText}>
                    <Text style={styles.deviceName}>{connectedDevice.name}</Text>
                    <Text style={styles.deviceStatus}>
                      {connectionStatus === 'connected' ? 'Connected via Wi-Fi' : 'Connecting...'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.disconnectButton}
                  onPress={() => handleDisconnect(connectedDevice)}
                >
                  <Ionicons name="power" size={18} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
              <View style={styles.deviceDetails}>
                <Text style={styles.deviceDetail}>IP: {connectedDevice.ip}</Text>
                <Text style={styles.deviceDetail}>Type: {connectedDevice.type}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Paired Devices */}
        {pairedDevices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paired Devices</Text>
            {pairedDevices.map((device) => (
              <View 
                key={device.id} 
                style={[
                  styles.pairedDeviceCard,
                  connectedDevice?.id === device.id && styles.currentDeviceCard
                ]}
              >
                <View style={styles.deviceInfo}>
                  <Ionicons 
                    name="hardware-chip-outline" 
                    size={20} 
                    color={connectedDevice?.id === device.id ? '#0B8457' : '#9B9B9B'} 
                  />
                  <View style={styles.deviceText}>
                    <Text style={styles.pairedDeviceName}>{device.name}</Text>
                    <Text style={styles.pairedDeviceIp}>{device.ip}</Text>
                  </View>
                </View>
                
                <View style={styles.deviceActions}>
                  {connectedDevice?.id !== device.id && (
                    <TouchableOpacity 
                      style={styles.connectButtonSmall}
                      onPress={() => handleQuickConnect(device)}
                    >
                      <Ionicons name="flash" size={16} color="#0B8457" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveDevice(device)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {pairedDevices.length === 0 && !connectedDevice && discoveredDevices.length === 0 && !isScanning && (
          <View style={styles.emptyState}>
            <Ionicons name="hardware-chip-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyStateTitle}>No Devices Found</Text>
            <Text style={styles.emptyStateDescription}>
              Scan for devices to discover ESP8266 sensors on your network
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelPassword}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="lock-closed" size={24} color="#0B8457" />
              <Text style={styles.modalTitle}>Enter Password</Text>
            </View>

            {selectedDevice && (
              <View style={styles.modalDeviceInfo}>
                <Ionicons name="hardware-chip" size={18} color="#9B9B9B" />
                <Text style={styles.modalDeviceName}>{selectedDevice.name}</Text>
              </View>
            )}

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Device Password</Text>
              <TextInput
                style={styles.modalPasswordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password (e.g., 112233)"
                placeholderTextColor="#9B9B9B"
                secureTextEntry
                keyboardType="numeric"
                maxLength={20}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={handleCancelPassword}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalConnectButton,
                  (!password.trim() || isConnecting) && styles.modalConnectButtonDisabled
                ]}
                onPress={handleConnectWithPassword}
                disabled={!password.trim() || isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="link" size={18} color="white" />
                    <Text style={styles.modalConnectButtonText}>Connect</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 12,

  },
  scanButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  quickScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0B8457',
  },
  quickScanButtonText: {
    color: '#0B8457',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B8457',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  scanningCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  scanningText: {
    fontSize: 14,
    color: '#9B9B9B',
    marginTop: 12,
    textAlign: 'center',
  },
  discoveredDevicesContainer: {
    gap: 8,
  },
  discoveredDeviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  discoveredDeviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  discoveredDeviceIp: {
    fontSize: 12,
    color: '#9B9B9B',
    marginTop: 2,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  helpText: {
    fontSize: 13,
    color: '#0B8457',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  manualEntryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manualEntryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  manualEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualIpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F5F7FA',
  },
  manualEntryHint: {
    fontSize: 12,
    color: '#9B9B9B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  connectedDeviceCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0B8457',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceText: {
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  deviceStatus: {
    fontSize: 14,
    color: '#0B8457',
    marginTop: 2,
  },
  disconnectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceDetail: {
    fontSize: 12,
    color: '#9B9B9B',
  },
  pairedDeviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  currentDeviceCard: {
    borderColor: '#0B8457',
  },
  pairedDeviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2332',
  },
  pairedDeviceIp: {
    fontSize: 12,
    color: '#9B9B9B',
    marginTop: 2,
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9B9B9B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    marginLeft: 12,
  },
  modalDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalDeviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2332',
    marginLeft: 8,
  },
  modalInputGroup: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  modalPasswordInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9B9B9B',
  },
  modalConnectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B8457',
    paddingVertical: 14,
    borderRadius: 10,
  },
  modalConnectButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  modalConnectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DeviceManagementScreen;