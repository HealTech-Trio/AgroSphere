// screens/Admin/AdminDashboard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
import StatCard from './components/StatCard';

export default function AdminDashboard({ navigation }) {
  const analytics = useAdminAnalytics();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Sign Out", 
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // The analytics hook will automatically refetch due to the interval
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Real-time platform analytics</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#0B8457" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Analytics Section */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0B8457']}
          />
        }
      >
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Farmers"
            value={analytics.totalFarmers.toLocaleString()}
            subtitle="Registered farmers"
            icon="people-outline"
            color="#0B8457"
            loading={analytics.loading}
          />

          <StatCard
            title="Total Agronomists"
            value={analytics.totalAgronomists.toLocaleString()}
            subtitle="All experts"
            icon="leaf-outline"
            color="#065A3B"
            loading={analytics.loading}
          />

          <StatCard
            title="Default Agronomists"
            value={analytics.hardcodedAgronomists.toLocaleString()}
            subtitle="Pre-loaded experts"
            icon="star-outline"
            color="#FF9800"
            loading={analytics.loading}
          />

          <StatCard
            title="Custom Agronomists"
            value={analytics.customAgronomists.toLocaleString()}
            subtitle="Admin added"
            icon="add-circle-outline"
            color="#2196F3"
            loading={analytics.loading}
          />

          <StatCard
            title="Total Farms"
            value={analytics.totalFarms.toLocaleString()}
            subtitle="Registered farms"
            icon="business-outline"
            color="#FF9800"
            loading={analytics.loading}
          />

          <StatCard
            title="Active Users"
            value={analytics.activeUsers.toLocaleString()}
            subtitle="Last 7 days"
            icon="trending-up-outline"
            color="#2196F3"
            loading={analytics.loading}
          />

          <StatCard
            title="Pending Verifications"
            value={analytics.pendingVerifications.toLocaleString()}
            subtitle="Awaiting approval"
            icon="time-outline"
            color="#F44336"
            loading={analytics.loading}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('AgronomistManagement')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#0B845720' }]}>
              <Ionicons name="people-outline" size={28} color="#0B8457" />
            </View>
            <Text style={styles.actionTitle}>Manage Agronomists</Text>
            <Text style={styles.actionDescription}>
              Add, edit, and delete agronomist profiles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('UserManagement')} // You can create this later
          >
            <View style={[styles.actionIcon, { backgroundColor: '#2196F320' }]}>
              <Ionicons name="person-outline" size={28} color="#2196F3" />
            </View>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionDescription}>
              View and manage farmer accounts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Analytics')} // You can create this later
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF980020' }]}>
              <Ionicons name="analytics-outline" size={28} color="#FF9800" />
            </View>
            <Text style={styles.actionTitle}>Detailed Analytics</Text>
            <Text style={styles.actionDescription}>
              View comprehensive platform stats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('SystemSettings')} // You can create this later
          >
            <View style={[styles.actionIcon, { backgroundColor: '#9C27B020' }]}>
              <Ionicons name="settings-outline" size={28} color="#9C27B0" />
            </View>
            <Text style={styles.actionTitle}>System Settings</Text>
            <Text style={styles.actionDescription}>
              Configure platform settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity (Optional - you can expand this later) */}
        {/* <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.recentActivity}>
          <View style={styles.activityItem}>
            <Ionicons name="person-add-outline" size={16} color="#0B8457" />
            <Text style={styles.activityText}>5 new farmers registered today</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#2196F3" />
            <Text style={styles.activityText}>12 consultations completed</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-done-outline" size={16} color="#065A3B" />
            <Text style={styles.activityText}>3 farm verifications approved</Text>
          </View>
        </View> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B8457',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0B8457',
  },
  signOutText: {
    color: '#0B8457',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2332',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2332',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  recentActivity: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  activityText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
});