// screens/Admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';

export default function UserManagement({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    farmers: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFarms, setUserFarms] = useState([]);
  const [showFarmsModal, setShowFarmsModal] = useState(false);
  const [loadingFarms, setLoadingFarms] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(usersData);
      calculateStats(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (usersData) => {
    const total = usersData.length;
    const verified = usersData.filter(user => user.emailVerified === true).length;
    const unverified = usersData.filter(user => user.emailVerified === false).length;
    const farmers = usersData.filter(user => 
      user.role === 'farmer' || !user.role || user.role === undefined
    ).length;

    setStats({ total, verified, unverified, farmers });
  };

  const handleToggleVerification = async (user) => {
    try {
      const userRef = doc(firestore, 'users', user.id);
      await updateDoc(userRef, {
        emailVerified: !user.emailVerified
      });

      // Update local state
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, emailVerified: !user.emailVerified } : u
      );
      setUsers(updatedUsers);
      calculateStats(updatedUsers);

      Alert.alert('Success', `User ${!user.emailVerified ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user verification status');
    }
  };

  const handleViewFarms = async (user) => {
    setSelectedUser(user);
    setLoadingFarms(true);
    setShowFarmsModal(true);
    
    try {
      // Get farms from the user's farms subcollection
      const farmsSnapshot = await getDocs(collection(firestore, 'users', user.id, 'farms'));
      const farmsData = farmsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserFarms(farmsData);
    } catch (error) {
      console.error('Error loading farms:', error);
      Alert.alert('Error', 'Failed to load farms data');
      setUserFarms([]);
    } finally {
      setLoadingFarms(false);
    }
  };

  const handleCloseFarmsModal = () => {
    setShowFarmsModal(false);
    setSelectedUser(null);
    setUserFarms([]);
  };

  const filteredUsers = users.filter(user => {
    // Apply search filter
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply status filter
    let matchesFilter = true;
    switch (filter) {
      case 'verified':
        matchesFilter = user.emailVerified === true;
        break;
      case 'unverified':
        matchesFilter = user.emailVerified === false;
        break;
      case 'farmers':
        matchesFilter = user.role === 'farmer' || !user.role || user.role === undefined;
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.displayName || item.email).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.displayName || 'No Name'}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userRole}>
              {item.role === 'admin' ? 'Administrator' : 
               item.role === 'farmer' ? 'Farmer' : 'User'}
            </Text>
          </View>
        </View>
        <View style={styles.verificationStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.emailVerified ? '#0B8457' : '#FF9800' }
          ]} />
          <Text style={styles.statusText}>
            {item.emailVerified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
      </View>

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.statText}>
            Joined: {item.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.statText}>
            Last Login: {item.lastLogin?.toDate?.().toLocaleDateString() || 'Never'}
          </Text>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.toggleButton]}
          onPress={() => handleToggleVerification(item)}
        >
          <Ionicons 
            name={item.emailVerified ? "close-circle-outline" : "checkmark-circle-outline"} 
            size={18} 
            color={item.emailVerified ? "#FF9800" : "#0B8457"} 
          />
          <Text style={[
            styles.actionButtonText, 
            { color: item.emailVerified ? "#FF9800" : "#0B8457" }
          ]}>
            {item.emailVerified ? 'Unverify' : 'Verify'}
          </Text>
        </TouchableOpacity>

        {(item.role === 'farmer' || !item.role) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleViewFarms(item)}
          >
            <Ionicons name="business-outline" size={18} color="#2196F3" />
            <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>
              View Farms
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFarmItem = ({ item }) => (
    <View style={styles.farmCard}>
      <View style={styles.farmHeader}>
        <Text style={styles.farmName}>{item.name || 'Unnamed Farm'}</Text>
      </View>
      
      <View style={styles.farmDetails}>
        {item.location && (
          <View style={styles.farmDetailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.farmDetailText}>{item.location}</Text>
          </View>
        )}
        
        {item.size && (
          <View style={styles.farmDetailRow}>
            <Ionicons name="resize-outline" size={16} color="#666" />
            <Text style={styles.farmDetailText}>{item.size} hectares</Text>
          </View>
        )}
        
        {item.crops && item.crops.length > 0 && (
          <View style={styles.farmDetailRow}>
            <Ionicons name="leaf-outline" size={16} color="#666" />
            <Text style={styles.farmDetailText}>
              Crops: {item.crops.join(', ')}
            </Text>
          </View>
        )}
        
        {item.soilType && (
          <View style={styles.farmDetailRow}>
            <Ionicons name="earth-outline" size={16} color="#666" />
            <Text style={styles.farmDetailText}>Soil: {item.soilType}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.farmStats}>
        {item.yield && (
          <View style={styles.farmStat}>
            <Text style={styles.farmStatLabel}>Yield</Text>
            <Text style={styles.farmStatValue}>{item.yield}</Text>
          </View>
        )}
        
        {item.irrigation && (
          <View style={styles.farmStat}>
            <Text style={styles.farmStatLabel}>Irrigation</Text>
            <Text style={styles.farmStatValue}>{item.irrigation}</Text>
          </View>
        )}
      </View>
      
      {item.notes && (
        <View style={styles.farmNotes}>
          <Text style={styles.farmNotesLabel}>Notes:</Text>
          <Text style={styles.farmNotesText}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0B8457" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

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
        <Text style={styles.title}>Manage Users</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.verified}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.unverified}</Text>
          <Text style={styles.statLabel}>Unverified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.farmers}</Text>
          <Text style={styles.statLabel}>Farmers</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {['all', 'verified', 'unverified', 'farmers'].map(filterType => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterText,
              filter === filterType && styles.filterTextActive
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUsers();
            }}
            colors={['#0B8457']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'No users match the current filter'}
            </Text>
          </View>
        }
      />

      {/* Farms Modal */}
      <Modal
        visible={showFarmsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseFarmsModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={handleCloseFarmsModal}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedUser?.displayName || selectedUser?.email}'s Farms
            </Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <View style={styles.modalContent}>
            {loadingFarms ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0B8457" />
                <Text style={styles.loadingText}>Loading farms...</Text>
              </View>
            ) : userFarms.length > 0 ? (
              <View style={styles.farmsContainer}>
                <View style={styles.farmsHeader}>
                  <Text style={styles.farmsCount}>
                    {userFarms.length} farm{userFarms.length !== 1 ? 's' : ''} found
                  </Text>
                </View>
                
                <FlatList
                  data={userFarms}
                  renderItem={renderFarmItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.farmsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            ) : (
              <View style={styles.noFarmsContainer}>
                <Ionicons name="business-outline" size={64} color="#ccc" />
                <Text style={styles.noFarmsText}>No Farms Found</Text>
                <Text style={styles.noFarmsSubtext}>
                  This user hasn't added any farms yet.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B8457',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0B8457',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B8457',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  userStats: {
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
  },
  toggleButton: {
    borderColor: '#FF9800',
  },
  viewButton: {
    borderColor: '#2196F3',
  },
  actionButtonText: {
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B8457',
    textAlign: 'center',
    flex: 1,
  },
  modalHeaderRight: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmsContainer: {
    flex: 1,
  },
  farmsHeader: {
    marginBottom: 16,
  },
  farmsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  farmsList: {
    paddingBottom: 20,
  },
  noFarmsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noFarmsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noFarmsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // Farm Card Styles
  farmCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B8457',
    flex: 1,
  },
  farmStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  farmStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  farmDetails: {
    marginBottom: 12,
  },
  farmDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  farmDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  farmStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  farmStat: {
    marginRight: 16,
  },
  farmStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  farmStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  farmNotes: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  farmNotesLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  farmNotesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});