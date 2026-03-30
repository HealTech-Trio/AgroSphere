// screens/Profile/SecurityScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SecurityScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [securitySettings, setSecuritySettings] = useState({
    biometricsEnabled: true,
    twoFactorEnabled: false,
    appLockEnabled: false,
    securityNotifications: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeSession, setActiveSession] = useState({
    device: 'iPhone 14 Pro',
    location: 'Johannesburg, SA',
    lastActive: '2 hours ago'
  });

  const toggleSetting = (setting) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Simulate password change
    Alert.alert(
      'Success',
      'Password changed successfully!',
      [{ text: 'OK', onPress: () => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }) }]
    );
  };

  const handleLogoutOtherDevices = () => {
    Alert.alert(
      'Logout Other Devices',
      'This will sign out all other devices except this one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'All other devices have been signed out');
          }
        }
      ]
    );
  };

  const SecurityCard = ({ title, description, icon, rightComponent, onPress }) => (
    <TouchableOpacity 
      style={styles.securityCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color="#0B8457" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </View>
        {rightComponent}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header Gradient */}
      <LinearGradient
        colors={['rgba(11, 132, 87, 0.08)', 'transparent']}
        style={[styles.gradientHeader, { height: insets.top + 160 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#2E2E2E" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Security</Text>
          <Text style={styles.headerSubtitle}>Protect your account</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Password Change Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password</Text>
          <View style={styles.passwordCard}>
            <Text style={styles.passwordTitle}>Change Password</Text>
            <Text style={styles.passwordDescription}>
              Update your password to keep your account secure
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                placeholder="Enter current password"
                placeholderTextColor="#9B9B9B"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                placeholder="Enter new password"
                placeholderTextColor="#9B9B9B"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                placeholder="Confirm new password"
                placeholderTextColor="#9B9B9B"
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.primaryButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Features</Text>
          
          <SecurityCard
            title="Biometric Authentication"
            description="Use Face ID or Touch ID to log in"
            icon="finger-print"
            rightComponent={
              <Switch
                value={securitySettings.biometricsEnabled}
                onValueChange={() => toggleSetting('biometricsEnabled')}
                trackColor={{ false: '#E0E0E0', true: 'rgba(11, 132, 87, 0.3)' }}
                thumbColor={securitySettings.biometricsEnabled ? '#0B8457' : '#F5F5F5'}
              />
            }
          />

          <SecurityCard
            title="Two-Factor Authentication"
            description="Add an extra layer of security"
            icon="shield-checkmark"
            rightComponent={
              <Switch
                value={securitySettings.twoFactorEnabled}
                onValueChange={() => toggleSetting('twoFactorEnabled')}
                trackColor={{ false: '#E0E0E0', true: 'rgba(11, 132, 87, 0.3)' }}
                thumbColor={securitySettings.twoFactorEnabled ? '#0B8457' : '#F5F5F5'}
              />
            }
          />

          <SecurityCard
            title="App Lock"
            description="Require PIN when opening the app"
            icon="lock-closed"
            rightComponent={
              <Switch
                value={securitySettings.appLockEnabled}
                onValueChange={() => toggleSetting('appLockEnabled')}
                trackColor={{ false: '#E0E0E0', true: 'rgba(11, 132, 87, 0.3)' }}
                thumbColor={securitySettings.appLockEnabled ? '#0B8457' : '#F5F5F5'}
              />
            }
          />

          <SecurityCard
            title="Security Notifications"
            description="Get alerts for suspicious activity"
            icon="notifications"
            rightComponent={
              <Switch
                value={securitySettings.securityNotifications}
                onValueChange={() => toggleSetting('securityNotifications')}
                trackColor={{ false: '#E0E0E0', true: 'rgba(11, 132, 87, 0.3)' }}
                thumbColor={securitySettings.securityNotifications ? '#0B8457' : '#F5F5F5'}
              />
            }
          />
        </View>

        {/* Active Session Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Session</Text>
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Ionicons name="phone-portrait" size={20} color="#0B8457" />
              <Text style={styles.sessionDevice}>{activeSession.device}</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Current</Text>
              </View>
            </View>
            
            <View style={styles.sessionDetails}>
              <View style={styles.sessionDetail}>
                <Ionicons name="location" size={14} color="#666" />
                <Text style={styles.sessionDetailText}>{activeSession.location}</Text>
              </View>
              <View style={styles.sessionDetail}>
                <Ionicons name="time" size={14} color="#666" />
                <Text style={styles.sessionDetailText}>Last active: {activeSession.lastActive}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleLogoutOtherDevices}
            >
              <Ionicons name="log-out" size={16} color="#666" />
              <Text style={styles.secondaryButtonText}>Logout Other Devices</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#0B8457" />
              <Text style={styles.tipText}>Use a strong, unique password</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#0B8457" />
              <Text style={styles.tipText}>Enable two-factor authentication</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#0B8457" />
              <Text style={styles.tipText}>Regularly update your password</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#0B8457" />
              <Text style={styles.tipText}>Log out from unused devices</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  gradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 12,
  },
  securityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  passwordCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  passwordTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 4,
  },
  passwordDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2332',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#1A2332',
  },
  primaryButton: {
    backgroundColor: '#0B8457',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDevice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginLeft: 8,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#0B8457',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDetails: {
    gap: 8,
    marginBottom: 16,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});

export default SecurityScreen;