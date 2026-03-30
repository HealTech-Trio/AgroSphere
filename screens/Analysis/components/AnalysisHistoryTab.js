// screens/Analysis/components/AnalysisHistoryTab.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Animated,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { formatDate } from '../../AIAssistant/utils/helpers';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AnalysisResultScreen from './AnalysisResultScreen';

const AnalysisHistoryTab = ({ toolConfig, newEntry }) => {
  const [history, setHistory] = useState([]);
  const [archivedHistory, setArchivedHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [refreshKey])
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
      const historyKey = `@analysis_history_${toolConfig.id}`;
      const archiveKey = `@analysis_archive_${toolConfig.id}`;
      
      const savedHistory = await AsyncStorage.getItem(historyKey);
      const savedArchive = await AsyncStorage.getItem(archiveKey);
      
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      } else {
        setHistory([]);
      }
      
      if (savedArchive) {
        setArchivedHistory(JSON.parse(savedArchive));
      } else {
        setArchivedHistory([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
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
        item.result?.disease_name?.toLowerCase().includes(query) ||
        item.result?.description?.toLowerCase().includes(query) ||
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
          const nameA = a.result?.disease_name || 'Analysis Result';
          const nameB = b.result?.disease_name || 'Analysis Result';
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
      'Delete Analysis',
      'Are you sure you want to delete this analysis result? This action cannot be undone.',
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
                const archiveKey = `@analysis_archive_${toolConfig.id}`;
                await AsyncStorage.setItem(archiveKey, JSON.stringify(updatedArchive));
              } else {
                const updatedHistory = history.filter(item => item.id !== itemId);
                setHistory(updatedHistory);
                const historyKey = `@analysis_history_${toolConfig.id}`;
                await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));
              }
              setRefreshKey(prev => prev + 1);
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
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
      setHistory(updatedHistory);

      const updatedArchive = [itemToArchive, ...archivedHistory];
      setArchivedHistory(updatedArchive);

      const historyKey = `@analysis_history_${toolConfig.id}`;
      const archiveKey = `@analysis_archive_${toolConfig.id}`;
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      await AsyncStorage.setItem(archiveKey, JSON.stringify(updatedArchive));

      Alert.alert('Success', 'Analysis moved to archive.');
    } catch (error) {
      console.error('Error archiving item:', error);
      Alert.alert('Error', 'Failed to archive item. Please try again.');
    }
  };

  const handleUnarchiveItem = async (itemId) => {
    try {
      const itemToUnarchive = archivedHistory.find(item => item.id === itemId);
      if (!itemToUnarchive) return;

      const updatedArchive = archivedHistory.filter(item => item.id !== itemId);
      setArchivedHistory(updatedArchive);

      const updatedHistory = [itemToUnarchive, ...history];
      setHistory(updatedHistory);

      const historyKey = `@analysis_history_${toolConfig.id}`;
      const archiveKey = `@analysis_archive_${toolConfig.id}`;
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      await AsyncStorage.setItem(archiveKey, JSON.stringify(updatedArchive));

      Alert.alert('Success', 'Analysis restored from archive.');
    } catch (error) {
      console.error('Error unarchiving item:', error);
      Alert.alert('Error', 'Failed to restore item. Please try again.');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      `Are you sure you want to delete all ${showArchived ? 'archived' : 'analysis'} history? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (showArchived) {
                setArchivedHistory([]);
                const archiveKey = `@analysis_archive_${toolConfig.id}`;
                await AsyncStorage.removeItem(archiveKey);
              } else {
                setHistory([]);
                const historyKey = `@analysis_history_${toolConfig.id}`;
                await AsyncStorage.removeItem(historyKey);
              }
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getHealthColor = (percentage) => {
    if (percentage >= 80) return '#0B8457';
    if (percentage >= 60) return '#8BC34A';
    if (percentage >= 40) return '#FF9800';
    if (percentage >= 20) return '#FF5722';
    return '#F44336';
  };

  const getSeverityColor = (severity) => {
    const severityLower = severity?.toLowerCase() || '';
    if (severityLower.includes('severe') || severityLower.includes('high')) return '#F44336';
    if (severityLower.includes('moderate') || severityLower.includes('medium')) return '#FF9800';
    return '#0B8457';
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
    const healthPercentage = item.result?.health_percentage || item.result?.confidence || 75;
    const healthColor = getHealthColor(healthPercentage);

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
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.historyImage}
                resizeMode="cover"
              />
              <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
                <Text style={styles.healthBadgeText}>{Math.round(healthPercentage)}%</Text>
              </View>
            </View>
            
            <View style={styles.historyContent}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle} numberOfLines={1}>
                  {item.result?.disease_name || 'Analysis Result'}
                </Text>
                {item.result?.severity && (
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.result.severity) + '20' }]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(item.result.severity) }]}>
                      {item.result.severity}
                    </Text>
                  </View>
                )}
              </View>

              {item.result?.description && (
                <Text style={styles.historyDescription} numberOfLines={2}>
                  {item.result.description}
                </Text>
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
        {showArchived ? 'No Archived Analysis' : 'No Analysis History'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery 
          ? 'No results found for your search'
          : showArchived 
            ? 'Archived analysis results will appear here'
            : 'Your analysis history will appear here after you complete your first scan'
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
            placeholder={`Search ${showArchived ? 'archived' : 'analysis'} results...`}
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
        <AnalysisResultScreen
          visible={showResultModal}
          result={selectedItem.result}
          image={selectedItem.image}
          toolConfig={toolConfig}
          iotData={selectedItem.iot_data}
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
          isFromHistory={true}
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
  },
  imageContainer: {
    width: 100,
    height: 120,
    position: 'relative',
  },
  historyImage: {
    width: '100%',
    height: '100%',
  },
  healthBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 2,
  },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  historyContent: {
    flex: 1,
    padding: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
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
    backgroundColor: 'rgba(11, 132, 87, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  emptyHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B8457',
  },
});

export default AnalysisHistoryTab;