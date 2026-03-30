// screens/Admin/AnalyticsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen({ navigation }) {
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
        <Text style={styles.title}>Detailed Analytics</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.comingSoonContainer}>
          <Ionicons name="analytics-outline" size={80} color="#FF9800" />
          <Text style={styles.comingSoonTitle}>Advanced Analytics Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            We're working on comprehensive analytics with interactive charts, 
            user growth trends, farm productivity metrics, and detailed insights 
            about your platform's performance.
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={20} color="#0B8457" />
              <Text style={styles.featureText}>User Growth Analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="bar-chart" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Farm Productivity Charts</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar" size={20} color="#FF9800" />
              <Text style={styles.featureText}>Seasonal Trends</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="map" size={20} color="#9C27B0" />
              <Text style={styles.featureText}>Regional Insights</Text>
            </View>
          </View>

          <Text style={styles.estimatedText}>
            Estimated Launch: Next Update
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
    color: '#FF9800',
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