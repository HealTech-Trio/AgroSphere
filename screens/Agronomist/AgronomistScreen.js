// screens/AgronomistScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AgronomistCard from './components/AgronomistCard';
import FilterBar from './components/FilterBar';
import AgronomistMap from './components/AgronomistMap';
import { useAgronomists } from '../../hooks/useAgronomists';
import { filterOptions, sortOptions } from './data';

const AgronomistScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('distance');
  const [selectedAgronomist, setSelectedAgronomist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Use the hook to fetch agronomists from Firebase
  const { agronomists, loading, error } = useAgronomists();

  // For pull-to-refresh functionality
  const onRefresh = () => {
    setRefreshing(true);
    // The real-time listener will automatically update the data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredAndSortedAgronomists = useMemo(() => {
    if (!agronomists || agronomists.length === 0) {
      return [];
    }

    let filtered = [...agronomists];

    // Apply filter
    if (selectedFilter === 'available') {
      filtered = filtered.filter(ag => ag.available);
    } else if (selectedFilter === 'rating') {
      filtered = filtered.filter(ag => ag.rating >= 4.5);
    } else if (selectedFilter === 'distance') {
      // Note: You'll need to implement distance calculation based on user's location
      // For now, we'll use a placeholder
      filtered = filtered.filter(ag => {
        const distance = parseFloat(ag.distance?.split(' ')[0] || '999');
        return distance <= 5;
      });
    } else if (selectedFilter === 'experience') {
      filtered = filtered.filter(ag => {
        const experience = parseInt(ag.experience?.match(/\d+/)?.[0] || '0');
        return experience >= 10;
      });
    } else if (selectedFilter === 'city') {
      // You can implement city-based filtering here
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(ag =>
        ag.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ag.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ag.farmSpecialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ag.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'distance':
          const distA = parseFloat(a.distance?.split(' ')[0] || '999');
          const distB = parseFloat(b.distance?.split(' ')[0] || '999');
          return distA - distB;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'experience':
          const expA = parseInt(a.experience?.match(/\d+/)?.[0] || '0');
          const expB = parseInt(b.experience?.match(/\d+/)?.[0] || '0');
          return expB - expA;
        case 'city':
          return (a.city || '').localeCompare(b.city || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [agronomists, selectedFilter, selectedSort, searchQuery]);

  // Show loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B8457" />
          <Text style={styles.loadingText}>Loading agronomists...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>Failed to load agronomists</Text>
          <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['rgba(11, 132, 87, 0.29)', 'transparent']}
        style={[styles.gradientOverlay, { height: insets.top + 60 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: 16 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Find Agronomists</Text>
            <Text style={styles.headerSubtitle}>
              Connect with agricultural experts near you
            </Text>
          </View>

          <TouchableOpacity style={styles.headerIcon} onPress={() => console.log('Settings pressed')}>
            <Ionicons name="settings-outline" size={24} color="#2E2E2E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9B9B9B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, specialty, or crops..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9B9B9B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={activeTab === 'list' ? '#0B8457' : '#9B9B9B'} 
          />
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
            List View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'map' && styles.activeTab]}
          onPress={() => setActiveTab('map')}
        >
          <Ionicons 
            name="map" 
            size={20} 
            color={activeTab === 'map' ? '#0B8457' : '#9B9B9B'} 
          />
          <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>
            Map View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bar - Your existing component */}
      <FilterBar
        filters={filterOptions}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        sortOptions={sortOptions}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
      />

      {/* Content Area */}
      {activeTab === 'list' ? (
        <ScrollView 
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0B8457']}
              tintColor="#0B8457"
            />
          }
        >
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {filteredAndSortedAgronomists.length} agronomists found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedFilter !== 'all' && ` • ${filterOptions.find(f => f.value === selectedFilter)?.label}`}
            </Text>
          </View>

          {filteredAndSortedAgronomists.length > 0 ? (
            filteredAndSortedAgronomists.map((agronomist) => (
              <AgronomistCard
                key={agronomist.id}
                agronomist={agronomist}
                onPress={() => setSelectedAgronomist(agronomist)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>No agronomists found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : selectedFilter !== 'all'
                  ? 'Try changing your filter settings'
                  : 'No agronomists available'
                }
              </Text>
            </View>
          )}

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          <AgronomistMap
            agronomists={filteredAndSortedAgronomists}
            selectedAgronomist={selectedAgronomist}
            onMarkerPress={setSelectedAgronomist}
          />
          
          {selectedAgronomist && (
            <View style={styles.mapCard}>
              <AgronomistCard
                agronomist={selectedAgronomist}
                onPress={() => {}}
              />
            </View>
          )}

          {filteredAndSortedAgronomists.length === 0 && (
            <View style={styles.mapEmptyState}>
              <Text style={styles.emptyStateText}>No agronomists to display</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  // Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1A2332',
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  mapEmptyState: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A2332',
    letterSpacing: -0.5,
    marginBottom: 7,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9B9B9B',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9B9B9B',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#0B8457',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultsInfo: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#9B9B9B',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapCard: {
    position: 'absolute',
    bottom: 55,
    left: 16,
    right: 16,
  },
});

export default AgronomistScreen;