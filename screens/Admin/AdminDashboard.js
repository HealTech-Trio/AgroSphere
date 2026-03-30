// screens/Admin/AdminDashboard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
import { COLORS } from '../../constants/colors';
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
      <StatusBar barStyle="light-content" />
      {/* Hero Header */}
      <LinearGradient
        colors={[COLORS.inkDark, COLORS.inkSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />
        <View style={styles.heroContent}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroTitle}>Admin</Text>
              <Text style={styles.heroTitle2}>Dashboard</Text>
              <Text style={styles.heroSub}>Real-time platform analytics</Text>
            </View>
            <TouchableOpacity style={styles.heroSignOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.contentSheet}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  heroHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 44,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: { zIndex: 2 },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: { fontSize: 30, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  heroTitle2: { fontSize: 30, fontWeight: '900', color: COLORS.primaryLight, letterSpacing: -0.5 },
  heroSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 6,
  },
  heroSignOutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDeco1: {
    position: 'absolute', right: -30, top: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroDeco2: {
    position: 'absolute', right: 50, bottom: -50,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  contentSheet: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopRightRadius: 30,
    marginTop: -20,
    overflow: 'hidden',
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