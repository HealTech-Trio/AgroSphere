// screens/Admin/SystemSettings.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SystemSettings({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0B8457" />
        </TouchableOpacity>
        <Text style={styles.title}>System Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.comingSoonContainer}>
          <Ionicons name="settings-outline" size={80} color="#9C27B0" />
          <Text style={styles.comingSoonTitle}>System Settings Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            We're building comprehensive system settings to give you full control 
            over your platform. You'll be able to configure notifications, 
            manage platform features, and customize the user experience.
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="notifications" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Notification Management</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={20} color="#0B8457" />
              <Text style={styles.featureText}>Security Settings</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="color-palette" size={20} color="#FF9800" />
              <Text style={styles.featureText}>Appearance Customization</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="business" size={20} color="#9C27B0" />
              <Text style={styles.featureText}>Platform Configuration</Text>
            </View>
          </View>

          <Text style={styles.estimatedText}>
            Estimated Launch: Future Update
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B8457',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    padding: 20,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresList: {
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  estimatedText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});