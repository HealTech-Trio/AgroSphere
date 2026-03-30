// context/DeviceContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const DeviceContext = createContext();

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

export const DeviceProvider = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [realTimeData, setRealTimeData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadPairedDevices();
    autoReconnectLastDevice();
  }, []);

  const loadPairedDevices = async () => {
    try {
      const savedDevices = await AsyncStorage.getItem('pairedDevices');
      if (savedDevices) {
        setPairedDevices(JSON.parse(savedDevices));
      }
    } catch (error) {
      Alert.alert('Storage Error', 'Failed to load paired devices');
    }
  };

  const autoReconnectLastDevice = async () => {
    try {
      const lastDevice = await AsyncStorage.getItem('lastConnectedDevice');
      if (lastDevice) {
        const device = JSON.parse(lastDevice);
        await connectToDevice(device, device.password, true);
      }
    } catch (error) {
      // Silent fail for auto-reconnect
    }
  };

  // Scan for devices on the local network
  const scanForDevices = async () => {
    setIsScanning(true);
    const found = [];
    
    try {
      const subnet = '192.168.137.';
      
      console.log(' Scanning for ESP8266 devices...');
      console.log(` Checking ${subnet}1-254`);
      
      const scanPromises = [];
      
      for (let i = 1; i <= 254; i++) {
        const ip = subnet + i;
        scanPromises.push(checkDeviceAtIP(ip));
      }
      
      const results = await Promise.allSettled(scanPromises);
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          // Filter out already connected device
          if (!connectedDevice || result.value.ip !== connectedDevice.ip) {
            found.push(result.value);
            console.log(`✓ Found: ${result.value.name} at ${result.value.ip}`);
          }
        }
      });
      
      setDiscoveredDevices(found);
      
      if (found.length > 0) {
        console.log(` Scan complete: Found ${found.length} device(s)`);
      } else {
        console.log(' No devices found');
      }
    } catch (error) {
      Alert.alert('Scan Error', 'An error occurred during device scanning');
    } finally {
      setIsScanning(false);
    }
    
    return found;
  };

  // Quick scan - check most common IPs first
  const quickScanForDevices = async () => {
    setIsScanning(true);
    const found = [];
    
    try {
      const subnet = '192.168.137.';
      console.log(' Quick scanning common device IPs...');
      
      const quickRanges = [
        ...Array.from({length: 11}, (_, i) => 70 + i),
        ...Array.from({length: 21}, (_, i) => 100 + i),
        ...Array.from({length: 21}, (_, i) => 150 + i),
        2, 3, 4, 5,
      ];
      
      const scanPromises = quickRanges.map(i => checkDeviceAtIP(subnet + i));
      const results = await Promise.allSettled(scanPromises);
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          // Filter out already connected device
          if (!connectedDevice || result.value.ip !== connectedDevice.ip) {
            found.push(result.value);
            console.log(`✓ Found: ${result.value.name} at ${result.value.ip}`);
          }
        }
      });
      
      setDiscoveredDevices(found);
      
      if (found.length > 0) {
        console.log(`Quick scan complete: Found ${found.length} device(s)`);
      }
    } catch (error) {
      Alert.alert('Quick Scan Error', 'An error occurred during quick scanning');
    } finally {
      setIsScanning(false);
    }
    
    return found;
  };

  // Check if a device exists at given IP
  const checkDeviceAtIP = async (ip) => {
    try {
      // Try WebSocket connection first (faster)
      const wsCheck = await checkWebSocketAtIP(ip);
      if (wsCheck) return wsCheck;
      
      // Fallback to HTTP
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);
      
      const response = await fetch(`http://${ip}/device-info`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const deviceInfo = await response.json();
        return {
          id: deviceInfo.deviceId,
          name: deviceInfo.deviceName,
          ip: ip,
          type: deviceInfo.type || 'ESP8266',
          wsPort: deviceInfo.wsPort || 81,
          requiresAuth: deviceInfo.requiresAuth !== false,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Check if WebSocket server exists at IP
  const checkWebSocketAtIP = (ip) => {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(`ws://${ip}:81`);
        
        const timeout = setTimeout(() => {
          ws.close();
          resolve(null);
        }, 800);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({
            id: `ESP8266-${ip.split('.').pop()}`,
            name: `ESP8266 Device`,
            ip: ip,
            type: 'ESP8266',
            wsPort: 81,
            requiresAuth: true,
          });
        };
        
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(null);
        };
      } catch (error) {
        resolve(null);
      }
    });
  };

  // Connect to device with password (WiFi only)
  const connectToDevice = async (device, password, isAutoReconnect = false) => {
    if (!isAutoReconnect) {
      setConnectionStatus('connecting');
    }

    let wifiSuccess = false;
    let retryCount = 0;
    const maxRetries = 2;

    // Try WebSocket connection with authentication
    while (retryCount < maxRetries && !wifiSuccess) {
      try {
        wifiSuccess = await attemptWebSocketConnection(device, password);
        if (!wifiSuccess) {
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        Alert.alert('Connection Error', `Connection attempt ${retryCount + 1} failed`);
        retryCount++;
      }
    }

    if (wifiSuccess) {
      setConnectionStatus('connected');
      device.password = password;
      await handleSuccessfulConnection(device);
      return true;
    } else {
      setConnectionStatus('disconnected');
      return false;
    }
  };

  const attemptWebSocketConnection = async (device, password) => {
    return new Promise((resolve) => {
      const ws = new WebSocket(`ws://${device.ip}:${device.wsPort || 81}`);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);

      let authSent = false;

      ws.onopen = () => {
        console.log('WebSocket opened, waiting for auth request...');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received:', data);
          
          // Handle auth request
          if (data.type === 'auth_required' && !authSent) {
            authSent = true;
            const authMessage = JSON.stringify({
              type: 'auth',
              password: password
            });
            ws.send(authMessage);
            console.log('Sent authentication');
          }
          
          // Handle auth response
          if (data.type === 'auth_success') {
            clearTimeout(timeout);
            console.log('Authentication successful');
            
            // Set up ongoing message listener
            ws.onmessage = (event) => {
              try {
                const sensorData = JSON.parse(event.data);
                if (sensorData.type === 'sensor_data') {
                  setRealTimeData({
                    deviceId: sensorData.deviceId,
                    temperature: sensorData.temperature === "null" ? null : sensorData.temperature,
                    humidity: sensorData.humidity === "null" ? null : sensorData.humidity,
                    soil: sensorData.soil,
                    timestamp: Date.now()
                  });
                }
              } catch (error) {
                Alert.alert('Data Error', 'Failed to parse sensor data');
              }
            };
            
            device.ws = ws;
            resolve(true);
          }
          
          if (data.type === 'auth_failed') {
            clearTimeout(timeout);
            console.log('Authentication failed');
            ws.close();
            resolve(false);
          }
        } catch (error) {
          Alert.alert('Parse Error', 'Failed to parse WebSocket data');
        }
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        resolve(false);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        if (!authSent) {
          resolve(false);
        }
      };
    });
  };

  const handleSuccessfulConnection = async (device) => {
    setConnectedDevice(device);
    
    await AsyncStorage.setItem('lastConnectedDevice', JSON.stringify(device));
    
    const isAlreadyPaired = pairedDevices.some(d => d.id === device.id);
    if (!isAlreadyPaired) {
      const updatedPairedDevices = [...pairedDevices, device];
      setPairedDevices(updatedPairedDevices);
      await AsyncStorage.setItem('pairedDevices', JSON.stringify(updatedPairedDevices));
    } else {
      const updatedPairedDevices = pairedDevices.map(d => 
        d.id === device.id ? device : d
      );
      setPairedDevices(updatedPairedDevices);
      await AsyncStorage.setItem('pairedDevices', JSON.stringify(updatedPairedDevices));
    }

    // Remove connected device from discovered devices
    setDiscoveredDevices(prev => prev.filter(d => d.id !== device.id));
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      if (connectedDevice.ws) {
        connectedDevice.ws.close();
      }
    }
    
    setConnectedDevice(null);
    setRealTimeData(null);
    setConnectionStatus('disconnected');
    await AsyncStorage.removeItem('lastConnectedDevice');
  };

  const removePairedDevice = async (deviceId) => {
    const updatedDevices = pairedDevices.filter(device => device.id !== deviceId);
    setPairedDevices(updatedDevices);
    await AsyncStorage.setItem('pairedDevices', JSON.stringify(updatedDevices));
    
    if (connectedDevice && connectedDevice.id === deviceId) {
      await disconnectDevice();
    }
  };

  return (
    <DeviceContext.Provider value={{
      connectedDevice,
      pairedDevices,
      discoveredDevices,
      connectionStatus,
      realTimeData,
      isScanning,
      connectToDevice,
      disconnectDevice,
      removePairedDevice,
      scanForDevices,
      quickScanForDevices,
      setConnectionStatus
    }}>
      {children}
    </DeviceContext.Provider>
  );
};