import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const ScheduleModal = ({ 
  visible, 
  onClose, 
  onSave, 
  initialData, 
  selectedDate, 
  isSaving = false,
  crops = [] // Add crops prop for selection
}) => {
  const [formData, setFormData] = useState({
    cropName: '',
    cropType: '',
    activityType: 'planting',
    date: selectedDate,
    time: new Date(),
    notes: '',
    reminder: true,
    reminderTime: 30,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const initialDate = new Date(initialData.date);
      setFormData({
        ...initialData,
        date: initialDate,
        time: initialDate,
        activityType: initialData.activityType || initialData.type || 'planting',
        cropType: initialData.cropType || initialData.cropName || '',
      });
    } else {
      // Set default time to 8:00 AM
      const defaultTime = new Date(selectedDate);
      defaultTime.setHours(8, 0, 0, 0);
      
      setFormData({
        cropName: '',
        cropType: '',
        activityType: 'planting',
        date: selectedDate,
        time: defaultTime,
        notes: '',
        reminder: true,
        reminderTime: 30,
      });
    }
    setErrors({});
  }, [initialData, selectedDate]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validate crop selection
    if (!formData.cropType.trim()) {
      newErrors.cropType = 'Please select a crop';
    }

    // Validate date and time - prevent past dates
    const scheduledDateTime = new Date(formData.date);
    scheduledDateTime.setHours(formData.time.getHours());
    scheduledDateTime.setMinutes(formData.time.getMinutes());
    scheduledDateTime.setSeconds(0, 0);

    const now = new Date();
    now.setSeconds(0, 0);

    if (scheduledDateTime < now) {
      newErrors.dateTime = 'Cannot schedule for past date and time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (isSaving) return; // Prevent multiple saves
    
    if (!validateForm()) {
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(formData.date);
    scheduledDateTime.setHours(formData.time.getHours());
    scheduledDateTime.setMinutes(formData.time.getMinutes());
    scheduledDateTime.setSeconds(0, 0);

    // Auto-generate title based on crop and activity
    const title = `${formData.cropType} ${formData.activityType}`;

    onSave({
      ...formData,
      title: title,
      cropName: formData.cropType, // Keep for backward compatibility
      type: formData.activityType, // Keep for backward compatibility
      date: scheduledDateTime.toISOString(),
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
      setErrors({ ...errors, dateTime: null });
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData({ ...formData, time: selectedTime });
      setErrors({ ...errors, dateTime: null });
    }
  };

  const handleCropSelect = (crop) => {
    setFormData({ 
      ...formData, 
      cropType: crop.cropName,
      cropName: crop.cropName // Keep for backward compatibility
    });
    setShowCropPicker(false);
    setErrors({ ...errors, cropType: null });
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const activityTypes = [
    { id: 'planting', label: 'Planting', icon: 'leaf' },
    { id: 'irrigation', label: 'Irrigation', icon: 'water' },
    { id: 'fertilizing', label: 'Fertilizing', icon: 'flask' },
    { id: 'harvest', label: 'Harvest', icon: 'basket' },
    { id: 'treatment', label: 'Treatment', icon: 'medical' },
    { id: 'pruning', label: 'Pruning', icon: 'cut' },
    { id: 'spraying', label: 'Spraying', icon: 'spray' },
    { id: 'inspection', label: 'Inspection', icon: 'search' },
  ];

  const reminderTimes = [
    { label: '15 min before', value: 15 },
    { label: '30 min before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '1 day before', value: 1440 },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {initialData ? 'Edit Schedule' : 'New Schedule'}
            {isSaving && ' - Saving...'}
          </Text>
          <TouchableOpacity 
            onPress={handleClose} 
            style={styles.closeButton}
            disabled={isSaving}
          >
            <Ionicons name="close" size={24} color={isSaving ? '#ccc' : '#6c757d'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Activity Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activity Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityScroll}>
              {activityTypes.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityButton,
                    formData.activityType === activity.id && styles.activityButtonSelected,
                    isSaving && styles.buttonDisabled
                  ]}
                  onPress={() => !isSaving && setFormData({ ...formData, activityType: activity.id })}
                  disabled={isSaving}
                >
                  <Ionicons
                    name={activity.icon}
                    size={20}
                    color={
                      isSaving ? '#ccc' : 
                      formData.activityType === activity.id ? '#ffffff' : '#0B8457'
                    }
                  />
                  <Text style={[
                    styles.activityButtonText,
                    formData.activityType === activity.id && styles.activityButtonTextSelected,
                    isSaving && styles.textDisabled
                  ]}>
                    {activity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Crop Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Crop *</Text>
            <TouchableOpacity 
              style={[
                styles.cropSelector,
                errors.cropType && styles.inputError,
                isSaving && styles.buttonDisabled
              ]}
              onPress={() => !isSaving && setShowCropPicker(true)}
              disabled={isSaving}
            >
              <Text style={[
                formData.cropType ? styles.cropSelectedText : styles.placeholderText,
                isSaving && styles.textDisabled
              ]}>
                {formData.cropType || 'Tap to select a crop'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={isSaving ? '#ccc' : '#666'} />
            </TouchableOpacity>
            {errors.cropType && <Text style={styles.errorText}>{errors.cropType}</Text>}
          </View>

          {/* Date and Time */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity 
                style={[
                  styles.dateTimeButton, 
                  errors.dateTime && styles.inputError,
                  isSaving && styles.buttonDisabled
                ]}
                onPress={() => !isSaving && setShowDatePicker(true)}
                disabled={isSaving}
              >
                <Ionicons name="calendar" size={16} color={isSaving ? '#ccc' : '#6c757d'} />
                <Text style={[
                  styles.dateTimeText,
                  isSaving && styles.textDisabled
                ]}>
                  {formData.date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity 
                style={[
                  styles.dateTimeButton, 
                  errors.dateTime && styles.inputError,
                  isSaving && styles.buttonDisabled
                ]}
                onPress={() => !isSaving && setShowTimePicker(true)}
                disabled={isSaving}
              >
                <Ionicons name="time" size={16} color={isSaving ? '#ccc' : '#6c757d'} />
                <Text style={[
                  styles.dateTimeText,
                  isSaving && styles.textDisabled
                ]}>
                  {formData.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {errors.dateTime && (
            <Text style={styles.errorText}>{errors.dateTime}</Text>
          )}

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()} // Prevent past dates
              onChange={handleDateChange}
            />
          )}

          {/* Time Picker */}
          {showTimePicker && (
            <DateTimePicker
              value={formData.time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}

          {/* Reminder Settings */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={[styles.label, isSaving && styles.textDisabled]}>Set Reminder</Text>
              <Switch
                value={formData.reminder}
                onValueChange={(value) => !isSaving && setFormData({ ...formData, reminder: value })}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.reminder ? '#0B8457' : '#f4f3f4'}
                disabled={isSaving}
              />
            </View>

            {formData.reminder && (
              <View style={styles.reminderOptions}>
                <Text style={[styles.subLabel, isSaving && styles.textDisabled]}>Remind me</Text>
                <View style={styles.reminderGrid}>
                  {reminderTimes.map((reminder) => (
                    <TouchableOpacity
                      key={reminder.value}
                      style={[
                        styles.reminderButton,
                        formData.reminderTime === reminder.value && styles.reminderButtonSelected,
                        isSaving && styles.buttonDisabled
                      ]}
                      onPress={() => !isSaving && setFormData({ ...formData, reminderTime: reminder.value })}
                      disabled={isSaving}
                    >
                      <Text style={[
                        styles.reminderButtonText,
                        formData.reminderTime === reminder.value && styles.reminderButtonTextSelected,
                        isSaving && styles.textDisabled
                      ]}>
                        {reminder.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[
                styles.textInput, 
                styles.textArea,
                isSaving && styles.inputDisabled
              ]}
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChangeText={(text) => !isSaving && setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSaving}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={[
              styles.cancelButton, 
              isSaving && styles.buttonDisabled
            ]} 
            onPress={handleClose}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              isSaving && styles.saveButtonDisabled
            ]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {initialData ? 'Update Schedule' : 'Save Schedule'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Crop Selection Modal */}
        <Modal
          visible={showCropPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.cropModalContainer}>
            <View style={styles.cropModalHeader}>
              <Text style={styles.cropModalTitle}>Select Crop</Text>
              <TouchableOpacity onPress={() => setShowCropPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.cropList}>
              {crops.length === 0 ? (
                <View style={styles.emptyCrops}>
                  <Ionicons name="leaf-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyCropsText}>No crops available</Text>
                  <Text style={styles.emptyCropsSubtext}>Add crops in My Crops first</Text>
                </View>
              ) : (
                crops.map((crop) => (
                  <TouchableOpacity 
                    key={crop.id}
                    style={styles.cropItem}
                    onPress={() => handleCropSelect(crop)}
                  >
                    <View style={styles.cropInfo}>
                      <Text style={styles.cropName}>{crop.cropName}</Text>
                      <Text style={styles.cropFarm}>{crop.farmName}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B8457',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3b45',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2d3b45',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  inputDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    color: '#6c757d',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
  },
  // Activity Type Styles
  activityScroll: {
    flexDirection: 'row',
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  activityButtonSelected: {
    backgroundColor: '#0B8457',
    borderColor: '#0B8457',
  },
  activityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activityButtonTextSelected: {
    color: '#fff',
  },
  // Crop Selection Styles
  cropSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  cropSelectedText: {
    fontSize: 16,
    color: '#2d3b45',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6c757d',
  },
  // Date/Time Styles
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2d3b45',
  },
  // Reminder Styles
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderOptions: {
    marginTop: 12,
  },
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  reminderButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  reminderButtonSelected: {
    backgroundColor: '#0B8457',
    borderColor: '#0B8457',
  },
  reminderButtonText: {
    fontSize: 12,
    color: '#6c757d',
  },
  reminderButtonTextSelected: {
    color: '#ffffff',
  },
  // Footer Buttons
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0B8457',
    borderRadius: 8,
    padding: 16,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Disabled State Styles
  buttonDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  textDisabled: {
    color: '#6c757d',
  },
  // Crop Modal Styles
  cropModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  cropModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cropModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cropList: {
    flex: 1,
  },
  cropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  cropFarm: {
    fontSize: 14,
    color: '#666',
  },
  emptyCrops: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCropsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyCropsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default ScheduleModal;