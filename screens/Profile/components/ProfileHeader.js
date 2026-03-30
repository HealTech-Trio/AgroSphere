// screens/Profile/components/ProfileHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDevice } from '../../../context/DeviceContext';
import { useNavigation } from '@react-navigation/native';
import anonymous from '../../../assets/Images/anonymous.png';

const ProfileHeader = ({ 
  profileImage, 
  onImageChange, 
  farmerName, 
  farmerTitle, 
  farmerLocation,
  farmerBio,
  farmerExperience,
  farmerSpecialization 
}) => {
  const { connectedDevice, connectionStatus } = useDevice();
  const navigation = useNavigation();

  const handleManageDevices = () => {
    navigation.navigate('DeviceManagement');
  };

  const ConnectionStatusCard = () => {
    if (!connectedDevice) {
      return (
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <Ionicons name="hardware-chip-outline" size={20} color="#9B9B9B" />
            <Text style={styles.connectionTitle}>   No Device Connected</Text>
          </View>
          <Text style={styles.connectionDescription}>
            Connect an IoT device to monitor your farm in real-time
          </Text>
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={handleManageDevices}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.manageButtonText}>Connect Device</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.connectionCard}>
        <View style={styles.connectionHeader}>
          <View style={styles.deviceInfo}>
            <Ionicons name="hardware-chip" size={20} color="#0B8457" />
            <Text style={styles.connectionTitle}>  {connectedDevice.name}   </Text>
          </View>
          <View style={[
            styles.statusBadge,
            connectionStatus === 'connected' ? styles.connectedBadge : styles.connectingBadge
          ]}>
            <View style={[
              styles.statusDot,
              connectionStatus === 'connected' ? styles.connectedDot : styles.connectingDot
            ]} />
            <Text style={styles.statusText}>
              {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
            </Text>
          </View>
        </View>
        
        <View style={styles.connectionDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="wifi" size={14} color="#0B8457" />
            <Text style={styles.detailText}>Wi-Fi</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={14} color="#9B9B9B" />
            <Text style={styles.detailText}>{connectedDevice.ip}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.manageButton}
          onPress={handleManageDevices}
        >
          <Ionicons name="settings-outline" size={16} color="white" />
          <Text style={styles.manageButtonText}>Manage Devices</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={profileImage ? { uri: profileImage } : anonymous}
            style={styles.avatar}
          />
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{farmerName}</Text>
          <Text style={styles.userTitle}>{farmerTitle}</Text>
          
          {farmerBio && farmerBio !== "Tell us about your farming experience" && (
            <Text style={styles.userBio}>{farmerBio}</Text>
          )}
          
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color="#9B9B9B" />
            <Text style={styles.locationText}>{farmerLocation}</Text>
          </View>
          
          {(farmerExperience || farmerSpecialization) && (
            <View style={styles.expertiseContainer}>
              {farmerExperience && (
                <View style={styles.expertiseItem}>
                  <Ionicons name="time" size={12} color="#0B8457" />
                  <Text style={styles.expertiseText}>{farmerExperience}</Text>
                </View>
              )}
              {farmerSpecialization && (
                <View style={styles.expertiseItem}>
                  <Ionicons name="leaf" size={12} color="#0B8457" />
                  <Text style={styles.expertiseText}>{farmerSpecialization}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        <ConnectionStatusCard />
        
        <LinearGradient
          colors={['rgba(11, 132, 87, 0.1)', 'transparent']}
          style={styles.achievementBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="trophy" size={16} color="#0B8457" />
          <Text style={styles.achievementText}>Level 5 Farmer</Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#F0F0F0',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 4,
    textAlign: 'center',
  },
  userTitle: {
    fontSize: 14,
    color: '#0B8457',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  userBio: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#9B9B9B',
    marginLeft: 4,
  },
  expertiseContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  expertiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expertiseText: {
    fontSize: 11,
    color: '#0B8457',
    fontWeight: '500',
    marginLeft: 4,
  },
  connectionCard: {
    width: '100%',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginLeft: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedBadge: {
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
  },
  connectingBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectedDot: {
    backgroundColor: '#0B8457',
  },
  connectingDot: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  connectionDescription: {
    fontSize: 14,
    color: '#9B9B9B',
    marginBottom: 16,
    lineHeight: 20,
  },
  connectionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
  },
  detailText: {
    fontSize: 12,
    color: '#9B9B9B',
    marginLeft: 6,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B8457',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  manageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(11, 132, 87, 0.2)',
  },
  achievementText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0B8457',
    marginLeft: 6,
  },
});

export default ProfileHeader;