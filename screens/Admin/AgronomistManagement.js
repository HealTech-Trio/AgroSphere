// screens/Admin/AgronomistManagement.js
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
  Modal,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAgronomists, deleteAgronomist } from '../../utils/agronomistService';
import AgronomistForm from './components/AgronomistForm'; 
import { useAgronomists } from '../../hooks/useAgronomists'; // Add this import

export default function AgronomistManagement({ navigation }) {
  const { agronomists, loading, error } = useAgronomists(); // Use the hook
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAgronomist, setEditingAgronomist] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAgronomists = async () => {
    setRefreshing(true);
    // The useAgronomists hook will automatically refresh the data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = (agronomist) => {
    // Only allow deletion of custom (Firebase) agronomists
    if (agronomist.source === 'hardcoded') {
      Alert.alert(
        'Cannot Delete',
        'Default agronomists cannot be deleted. They are part of the pre-loaded expert database.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Agronomist',
      `Are you sure you want to delete ${agronomist.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAgronomist(agronomist.id);
              // The useAgronomists hook will automatically update the list
              Alert.alert('Success', 'Agronomist deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete agronomist');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (agronomist) => {
    // Only allow editing of custom (Firebase) agronomists
    if (agronomist.source === 'hardcoded') {
      Alert.alert(
        'Cannot Edit',
        'Default agronomists cannot be edited. They are part of the pre-loaded expert database.',
        [{ text: 'OK' }]
      );
      return;
    }
    setEditingAgronomist(agronomist);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingAgronomist(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAgronomist(null);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingAgronomist(null);
    // The useAgronomists hook will automatically refresh with the new data
  };

  const filteredAgronomists = agronomists.filter(agronomist =>
    agronomist.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agronomist.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agronomist.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAgronomistItem = ({ item }) => (
    <View style={styles.agronomistCard}>
      <View style={styles.cardHeader}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            {item.profileImage ? (
              <Image 
                source={{ uri: item.profileImage }} 
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {item.name?.split(' ').map(n => n[0]).join('')}
              </Text>
            )}
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.specialty}>{item.specialty}</Text>
            {/* Show source badge */}
            <View style={[
              styles.sourceBadge,
              { backgroundColor: item.source === 'hardcoded' ? '#FF9800' : '#0B8457' }
            ]}>
              <Text style={styles.sourceBadgeText}>
                {item.source === 'hardcoded' ? 'Default' : 'Custom'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.available ? '#0B8457' : '#F44336' }
          ]} />
          <Text style={styles.statusText}>
            {item.available ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.city}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.detailText}>{item.rating} ({item.reviews} reviews)</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.experience} experience</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
      </View>

      <View style={styles.farmSpecialties}>
        {item.farmSpecialties?.slice(0, 3).map((specialty, index) => (
          <View key={index} style={styles.specialtyTag}>
            <Text style={styles.specialtyTagText}>{specialty}</Text>
          </View>
        ))}
        {item.farmSpecialties?.length > 3 && (
          <Text style={styles.moreSpecialties}>+{item.farmSpecialties.length - 3} more</Text>
        )}
      </View>

      <View style={styles.cardActions}>
        {item.source === 'firebase' ? (
          // Show edit/delete for Firebase agronomists
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="create-outline" size={18} color="#0B8457" />
              <Text style={[styles.actionButtonText, { color: '#0B8457' }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#F44336" />
              <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Show view-only for hardcoded agronomists
          <View style={styles.readOnlyBadge}>
            <Ionicons name="lock-closed-outline" size={16} color="#666" />
            <Text style={styles.readOnlyText}>Read Only</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0B8457" />
        <Text style={styles.loadingText}>Loading agronomists...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>Failed to load agronomists</Text>
        <Text style={styles.errorSubtext}>Please check your connection</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAgronomists}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
        <Text style={styles.title}>Manage Agronomists</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddNew}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, specialty, or city..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Summary */}
      <View style={styles.statsSummary}>
        <Text style={styles.statsText}>
          {filteredAgronomists.length} agronomists total • 
          {filteredAgronomists.filter(a => a.source === 'hardcoded').length} default • 
          {filteredAgronomists.filter(a => a.source === 'firebase').length} custom
        </Text>
      </View>

      {/* Agronomists List */}
      <FlatList
        data={filteredAgronomists}
        renderItem={renderAgronomistItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={loadAgronomists}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No agronomists found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first custom agronomist'}
            </Text>
          </View>
        }
      />

      {/* Add/Edit Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AgronomistForm
          agronomist={editingAgronomist}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2332',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0B8457',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
  addButton: {
    backgroundColor: '#0B8457',
    padding: 8,
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
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
  statsSummary: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  agronomistCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
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
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  farmSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  specialtyTagText: {
    fontSize: 12,
    color: '#0B8457',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  cardActions: {
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
  editButton: {
    borderColor: '#0B8457',
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  actionButtonText: {
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 14,
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
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  sourceBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  readOnlyText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});