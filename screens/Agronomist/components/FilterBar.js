import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FilterBar = ({ filters, selectedFilter, onFilterChange, sortOptions, selectedSort, onSortChange }) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowFilterModal(true)}
      >
        <Ionicons name="filter" size={16} color="#0B8457" />
        <Text style={styles.filterText}>
          {filters.find(f => f.value === selectedFilter)?.label || 'Filter'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.sortButton}
        onPress={() => setShowSortModal(true)}
      >
        <Ionicons name="swap-vertical" size={16} color="#0B8457" />
        <Text style={styles.sortText}>
          {sortOptions.find(s => s.value === selectedSort)?.label || 'Sort'}
        </Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Agronomists</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#2E2E2E" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={styles.modalItem}
                  onPress={() => {
                    onFilterChange(filter.value);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{filter.label}</Text>
                  {selectedFilter === filter.value && (
                    <Ionicons name="checkmark" size={20} color="#0B8457" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color="#2E2E2E" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {sortOptions.map((sort) => (
                <TouchableOpacity
                  key={sort.value}
                  style={styles.modalItem}
                  onPress={() => {
                    onSortChange(sort.value);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{sort.label}</Text>
                  {selectedSort === sort.value && (
                    <Ionicons name="checkmark" size={20} color="#0B8457" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#0B8457',
    fontWeight: '500',
    marginLeft: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortText: {
    fontSize: 14,
    color: '#0B8457',
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1A2332',
  },
});

export default FilterBar;