// screens/MyCrops/components/FilterSortBar.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FILTER_OPTIONS, SORT_OPTIONS } from '../utils/constants';

const FilterSortBar = ({ 
  activeFilter, 
  onFilterChange, 
  activeSort, 
  onSortChange,
  cropCount 
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const filterOptions = [
    { key: FILTER_OPTIONS.ALL, label: 'All Crops', icon: 'leaf' },
    { key: 'early_stage', label: 'Early Stage', icon: 'flower' },
    { key: 'late_stage', label: 'Late Stage', icon: 'leaf' },
  ];

  const sortOptions = [
    { key: SORT_OPTIONS.NAME, label: 'Name', icon: 'text' },
    { key: SORT_OPTIONS.AREA, label: 'Highest Hectares', icon: 'resize' },
    { key: 'lowest_area', label: 'Lowest Hectares', icon: 'resize' },
    { key: SORT_OPTIONS.GROWTH, label: 'Growth Stage', icon: 'trending-up' },
  ];

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Crops</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#2E2E2E" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.modalOption,
                  activeFilter === option.key && styles.modalOptionActive
                ]}
                onPress={() => {
                  onFilterChange(option.key);
                  setShowFilterModal(false);
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={activeFilter === option.key ? '#0B8457' : '#7B7B7B'} 
                />
                <Text style={[
                  styles.modalOptionText,
                  activeFilter === option.key && styles.modalOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {activeFilter === option.key && (
                  <Ionicons name="checkmark" size={20} color="#0B8457" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const SortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
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
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.modalOption,
                  activeSort === option.key && styles.modalOptionActive
                ]}
                onPress={() => {
                  onSortChange(option.key);
                  setShowSortModal(false);
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={activeSort === option.key ? '#0B8457' : '#7B7B7B'} 
                />
                <Text style={[
                  styles.modalOptionText,
                  activeSort === option.key && styles.modalOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {activeSort === option.key && (
                  <Ionicons name="checkmark" size={20} color="#0B8457" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.cropCount}>{cropCount} crops</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color="#0B8457" />
          <Text style={styles.actionText}>Filter</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={20} color="#0B8457" />
          <Text style={styles.actionText}>Sort</Text>
        </TouchableOpacity>
      </View>

      <FilterModal />
      <SortModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cropCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#0B8457',
    fontWeight: '500',
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
    maxHeight: '60%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  modalOptionActive: {
    backgroundColor: '#F0F7F0',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1A2332',
  },
  modalOptionTextActive: {
    color: '#0B8457',
    fontWeight: '500',
  },
});

export default FilterSortBar;