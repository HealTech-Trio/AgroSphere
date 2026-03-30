// screens/Analysis/SoilHealth/SoilHistoryTab.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SoilResultScreen from './SoilResultScreen';

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SoilHistoryTab = ({ toolConfig, newEntry }) => {
  const [history, setHistory] = useState([]);
  const [archivedHistory, setArchivedHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  useEffect(() => {
    if (newEntry) {
      setHistory(prevHistory => {
        const exists = prevHistory.some(item => item.id === newEntry.id);
        if (!exists) {
          return [newEntry, ...prevHistory];
        }
        return prevHistory;
      });
    }
  }, [newEntry]);

  useEffect(() => {
    filterAndSortHistory();
  }, [history, archivedHistory, searchQuery, sortOption, showArchived]);

  const loadHistory = async () => {
    try {
      const historyKey = '@analysis_history_soil';
      const archiveKey = '@analysis_archive_soil';
      
      const savedHistory = await AsyncStorage.getItem(historyKey);
      const savedArchive = await AsyncStorage.getItem(archiveKey);
      
      setHistory(savedHistory ? JSON.parse(savedHistory) : []);
      setArchivedHistory(savedArchive ? JSON.parse(savedArchive) : []);
    } catch (error) {
      setHistory([]);
      setArchivedHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortHistory = () => {
    let filtered = [...(showArchived ? archivedHistory : history)];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.farm_data?.name?.toLowerCase().includes(query) ||
        item.farm_data?.location?.toLowerCase().includes(query) ||
        item.result?.condition?.toLowerCase().includes(query) ||
        formatDate(item.timestamp).toLowerCase().includes(query)
      );
    }

    switch (sortOption) {
      case 'recent':
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => {
          const nameA = a.farm_data?.name || 'Unknown Farm';
          const nameB = b.farm_data?.name || 'Unknown Farm';
          return nameA.localeCompare(nameB);
        });
        break;
    }

    setFilteredHistory(filtered);
  };

  const handleItemPress = (item) => {
    setSelectedItem(item);
    setShowResultModal(true);
  };

  const handleDeleteItem = async (itemId, isArchived = false) => {
    Alert.alert(
      'Delete Assessment',
      'Are you sure you want to delete this soil assessment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isArchived) {
                const updatedArchive = archivedHistory.filter(item => item.id !== itemId);
                setArchivedHistory(updatedArchive);
                await AsyncStorage.setItem('@analysis_archive_soil', JSON.stringify(updatedArchive));
              } else {
                const updatedHistory = history.filter(item => item.id !== itemId);
                setHistory(updatedHistory);
                await AsyncStorage.setItem('@analysis_history_soil', JSON.stringify(updatedHistory));
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item.');
            }
          },
        },
      ]
    );
  };

  const handleArchiveItem = async (itemId) => {
    try {
      const itemToArchive = history.find(item => item.id === itemId);
      if (!itemToArchive) return;

      const updatedHistory = history.filter(item => item.id !== itemId);
      const updatedArchive = [itemToArchive, ...archivedHistory];
      
      setHistory(updatedHistory);
      setArchivedHistory(updatedArchive);

      await AsyncStorage.setItem('@analysis_history_soil', JSON.stringify(updatedHistory));
      await AsyncStorage.setItem('@analysis_archive_soil', JSON.stringify(updatedArchive));

      Alert.alert('Success', 'Assessment moved to archive.');
    } catch (error) {
      Alert.alert('Error', 'Failed to archive item.');
    }
  };

  const handleUnarchiveItem = async (itemId) => {
    try {
      const itemToUnarchive = archivedHistory.find(item => item.id === itemId);
      if (!itemToUnarchive) return;

      const updatedArchive = archivedHistory.filter(item => item.id !== itemId);
      const updatedHistory = [itemToUnarchive, ...history];
      
      setArchivedHistory(updatedArchive);
      setHistory(updatedHistory);

      await AsyncStorage.setItem('@analysis_history_soil', JSON.stringify(updatedHistory));
      await AsyncStorage.setItem('@analysis_archive_soil', JSON.stringify(updatedArchive));

      Alert.alert('Success', 'Assessment restored from archive.');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore item.');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      `Are you sure you want to delete all ${showArchived ? 'archived' : 'assessment'} history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (showArchived) {
                setArchivedHistory([]);
                await AsyncStorage.removeItem('@analysis_archive_soil');
              } else {
                setHistory([]);
                await AsyncStorage.removeItem('@analysis_history_soil');
              }
            } catch (error) {
            }
          },
        },
      ]
    );
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#0B8457';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FF9800';
    if (score >= 20) return '#FF5722';
    return '#F44336';
  };

  const renderRightActions = (progress, dragX, item) => {
    const scale = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActions}>
        {showArchived ? (
          <>
            <TouchableOpacity 
              style={[styles.swipeAction, styles.unarchiveAction]}
              onPress={() => handleUnarchiveItem(item.id)}
            >
              <Animated.View style={[styles.swipeActionContent, { transform: [{ scale }] }]}>
                <Ionicons name="arrow-undo" size={24} color="white" />
                <Text style={styles.swipeActionText}>Restore</Text>
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.swipeAction, styles.deleteAction]}
              onPress={() => handleDeleteItem(item.id, true)}
            >
              <Animated.View style={[styles.swipeActionContent, { transform: [{ scale }] }]}>
                <Ionicons name="trash" size={24} color="white" />
                <Text style={styles.swipeActionText}>Delete</Text>
              </Animated.View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.swipeAction, styles.archiveAction]}
              onPress={() => handleArchiveItem(item.id)}
            >
              <Animated.View style={[styles.swipeActionContent, { transform: [{ scale }] }]}>
                <Ionicons name="archive" size={24} color="white" />
                <Text style={styles.swipeActionText}>Archive</Text>
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.swipeAction, styles.deleteAction]}
              onPress={() => handleDeleteItem(item.id)}
            >
              <Animated.View style={[styles.swipeActionContent, { transform: [{ scale }] }]}>
                <Ionicons name="trash" size={24} color="white" />
                <Text style={styles.swipeActionText}>Delete</Text>
              </Animated.View>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderHistoryItem = ({ item }) => {
    const healthScore = item.result?.health_score || 0;
    const healthColor = getHealthColor(healthScore);

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
      >
        <TouchableOpacity 
          style={styles.historyItem}
          activeOpacity={0.7}
          onPress={() => handleItemPress(item)}
        >
          <View style={styles.historyCard}>
            <View style={styles.scoreContainer}>
              <View style={[styles.scoreCircle, { borderColor: healthColor }]}>
                <Text style={[styles.scoreText, { color: healthColor }]}>
                  {Math.round(healthScore)}
                </Text>
              </View>
            </View>
            
            <View style={styles.historyContent}>
              <View style={styles.historyHeader}>
                <Text style={styles.farmName} numberOfLines={1}>
                  {item.farm_data?.name || 'Unknown Farm'}
                </Text>
                {item.result?.condition && (
                  <View style={[styles.conditionBadge, { backgroundColor: healthColor + '20' }]}>
                    <Text style={[styles.conditionText, { color: healthColor }]}>
                      {item.result.condition}
                    </Text>
                  </View>
                )}
              </View>

              {item.farm_data?.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#9B9B9B" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.farm_data.location}
                  </Text>
                </View>
              )}

              <View style={styles.historyFooter}>
                <View style={styles.historyMeta}>
                  <Ionicons name="time-outline" size={14} color="#9B9B9B" />
                  <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
                </View>

                {item.iot_data && (
                  <View style={styles.iotBadge}>
                    <Ionicons name="hardware-chip" size={14} color="#0B8457" />
                    <Text style={styles.iotBadgeText}>IoT</Text>
                  </View>
                )}
              </View>
            </View>

            {showArchived && (
              <View style={styles.archiveIndicator}>
                <Ionicons name="archive" size={16} color="#FFA500" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons 
          name={showArchived ? "archive" : "history"} 
          size={64} 
          color="#E0E0E0" 
        />
      </View>
      <Text style={styles.emptyTitle}>
        {showArchived ? 'No Archived Assessments' : 'No Assessment History'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery 
          ? 'No results found for your search'
          : showArchived 
            ? 'Archived soil assessments will appear here'
            : 'Your soil assessment history will appear here after you complete your first analysis'
        }
      </Text>
      {!searchQuery && !showArchived && (
        <View style={styles.emptyHint}>
          <Ionicons name="arrow-back" size={20} color="#9B9B9B" />
          <Text style={styles.emptyHintText}>Go to Analysis tab to get started</Text>
        </View>
      )}
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9B9B9B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${showArchived ? 'archived' : 'assessment'} results...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9B9B9B"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9B9B9B" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort:</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                setSortOption(current => {
                  switch (current) {
                    case 'recent': return 'oldest';
                    case 'oldest': return 'alphabetical';
                    default: return 'recent';
                  }
                });
              }}
            >
              <View style={styles.sortButtonContent}>
                <Text style={styles.sortButtonText}>
                  {sortOption === 'recent' ? 'Recent' : 
                   sortOption === 'oldest' ? 'Oldest' : 'A-Z'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.archiveToggleContainer}>
            <Text style={styles.archiveLabel}>Archives</Text>
            <Switch
              value={showArchived}
              onValueChange={setShowArchived}
              trackColor={{ false: '#E0E0E0', true: toolConfig.color }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>
      </View>

      {/* Results Count and Clear Button */}
      {filteredHistory.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredHistory.length} {filteredHistory.length === 1 ? 'result' : 'results'}
            {showArchived && ' (Archived)'}
          </Text>
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* History List */}
      <FlatList
        data={filteredHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadHistory}
      />

      {/* Result Modal */}
      {selectedItem && (
        <SoilResultScreen
          visible={showResultModal}
          result={selectedItem.result}
          toolConfig={toolConfig}
          iotData={selectedItem.iot_data}
          farmData={selectedItem.farm_data}
          connectedDevice={selectedItem.iot_data ? { id: selectedItem.iot_data.device_id } : null}
          onClose={() => {
            setShowResultModal(false);
            setSelectedItem(null);
          }}
          onNewAnalysis={() => {
            setShowResultModal(false);
            setSelectedItem(null);
          }}
          onSaveComplete={null}
        />
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  controlsContainer: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A2332',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    minWidth: 90,
  },
  sortButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  archiveToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  historyItem: {
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    padding: 16,
  },
  scoreContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  farmName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginRight: 8,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#9B9B9B',
    flex: 1,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#9B9B9B',
  },
  iotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  iotBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0B8457',
  },
  archiveIndicator: {
    padding: 12,
    justifyContent: 'center',
  },
  swipeActions: {
    flexDirection: 'row',
    width: 160,
  },
  swipeAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionContent: {
    alignItems: 'center',
  },
  archiveAction: {
    backgroundColor: '#FFA500',
  },
  unarchiveAction: {
    backgroundColor: '#0B8457',
  },
  deleteAction: {
    backgroundColor: '#F44336',
  },
  swipeActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(149, 169, 156, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  emptyHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#95A99C',
  },
});

export default SoilHistoryTab;