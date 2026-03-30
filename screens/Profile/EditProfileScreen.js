// screens/Profile/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, firestore, storage } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import CONFIG from '../../config';
import anonymous from '../../assets/Images/anonymous.png';

const EditProfileScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { userData } = route.params || {};

  // Google Places API configuration
  const GOOGLE_PLACES_API_KEY = CONFIG.GOOGLE_MAPS_API_KEY;
  const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    title: '',
    location: '',
    bio: '',
    experience: '',
    specialization: '',
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Location suggestion states
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const [suggestionsModalVisible, setSuggestionsModalVisible] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        title: userData.title || '',
        location: userData.location || '',
        bio: userData.bio || '',
        experience: userData.experience || '',
        specialization: userData.specialization || '',
      });
      setProfileImage(userData.photoURL || null);
      setLocationQuery(userData.location || '');
    }
  }, [userData]);

  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to change your profile picture.');
      }
    })();
  }, []);

    // Fetch location suggestions
    useEffect(() => {
    const timeoutId = setTimeout(() => {
        if (locationQuery && locationQuery.length >= 3) {
        fetchLocationSuggestions(locationQuery);
        } else {
        setLocationSuggestions([]);
        setSuggestionsModalVisible(false);
        }
    }, 500);

    return () => clearTimeout(timeoutId);
    }, [locationQuery]);

    // Fetch location suggestions from Google Places API
    const fetchLocationSuggestions = async (query) => {
    if (!query || query.length < 3) {
        setLocationSuggestions([]);
        setSuggestionsModalVisible(false);
        return;
    }

    if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        console.warn('Google Maps API key not configured');
        setLocationSuggestions([]);
        setSuggestionsModalVisible(false);
        return;
    }

    setIsFetchingLocations(true);
    try {
        const response = await fetch(
        `${GOOGLE_PLACES_API_URL}?input=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&types=geocode`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.predictions.length > 0) {
        setLocationSuggestions(data.predictions);
        setSuggestionsModalVisible(true);
        } else {
        setLocationSuggestions([]);
        setSuggestionsModalVisible(false);
        }
    } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setLocationSuggestions([]);
        setSuggestionsModalVisible(false);
    }
    setIsFetchingLocations(false);
    };

    // Handle location selection
    const handleLocationSelect = (location) => {
    setFormData(prev => ({ ...prev, location: location.description }));
    setLocationQuery(location.description);
    
    // Clear suggestions and hide modal immediately
    setLocationSuggestions([]);
    setSuggestionsModalVisible(false);
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
        Keyboard.dismiss();
    }, 100);
    };

    // Handle location input change
    const handleLocationChange = (text) => {
    setLocationQuery(text);
    setFormData(prev => ({ ...prev, location: text }));
    
    // Only show suggestions if we have a query
    if (!text || text.length < 3) {
        setLocationSuggestions([]);
        setSuggestionsModalVisible(false);
    }
    };

  // Handle profile image change
  const handleImageChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUploading(true);
        
        const imageUri = result.assets[0].uri;
        const downloadURL = await uploadImageToStorage(imageUri);
        
        if (downloadURL) {
          setProfileImage(downloadURL);
          Alert.alert('Success', 'Profile picture updated! Remember to save your changes.');
        }
        
        setUploading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setUploading(false);
    }
  };

  // Upload image to Firebase Storage
  const uploadImageToStorage = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return null;
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const updateData = {
        displayName: formData.displayName.trim(),
        title: formData.title.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
        experience: formData.experience.trim(),
        specialization: formData.specialization.trim(),
        updatedAt: new Date(),
      };

      if (profileImage && profileImage !== userData?.photoURL) {
        await updateProfile(user, {
          displayName: formData.displayName.trim(),
          photoURL: profileImage
        });
        updateData.photoURL = profileImage;
      } else {
        await updateProfile(user, {
          displayName: formData.displayName.trim(),
        });
      }

      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, updateData);

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
    setSaving(false);
  };

  // Experience options
  const experienceOptions = [
    { label: 'Beginner (0-2 years)', value: 'Beginner' },
    { label: 'Intermediate (3-5 years)', value: 'Intermediate' },
    { label: 'Experienced (6-10 years)', value: 'Experienced' },
    { label: 'Expert (10+ years)', value: 'Expert' },
  ];

  // Specialization options
  const specializationOptions = [
    { label: 'Crop Farming', value: 'Crop Farming' },
    { label: 'Livestock Farming', value: 'Livestock Farming' },
    { label: 'Mixed Farming', value: 'Mixed Farming' },
    { label: 'Organic Farming', value: 'Organic Farming' },
    { label: 'Hydroponics', value: 'Hydroponics' },
    { label: 'Greenhouse Farming', value: 'Greenhouse Farming' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0B8457" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#0B8457" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={profileImage ? { uri: profileImage } : anonymous}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={[styles.editImageButton, uploading && styles.buttonDisabled]}
              onPress={handleImageChange}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="camera" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.imageHint}>
            {uploading ? 'Uploading...' : 'Tap to change profile picture'}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.displayName}
                onChangeText={(text) => handleInputChange('displayName', text)}
                placeholder="Enter your full name"
                placeholderTextColor="#9B9B9B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Professional Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => handleInputChange('title', text)}
                placeholder="e.g., Professional Farmer, Agripreneur"
                placeholderTextColor="#9B9B9B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={styles.input}
                  value={locationQuery}
                  onChangeText={handleLocationChange}
                  placeholder="Start typing your location..."
                  placeholderTextColor="#9B9B9B"
                />
                {isFetchingLocations && (
                  <View style={styles.loadingIndicator}>
                    <Ionicons name="search" size={20} color="#999" />
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Professional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farming Experience</Text>
              <View style={styles.optionsContainer}>
                {experienceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      formData.experience === option.value && styles.optionButtonSelected
                    ]}
                    onPress={() => handleInputChange('experience', option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.experience === option.value && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specialization</Text>
              <View style={styles.optionsContainer}>
                {specializationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      formData.specialization === option.value && styles.optionButtonSelected
                    ]}
                    onPress={() => handleInputChange('specialization', option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.specialization === option.value && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                placeholder="Tell us about your farming journey, interests, and expertise..."
                placeholderTextColor="#9B9B9B"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {formData.bio.length}/200 characters
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveLargeButton, (saving || uploading) && styles.buttonDisabled]} 
            onPress={handleSaveProfile}
            disabled={saving || uploading}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveLargeButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving || uploading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Location Suggestions Modal */}
        {suggestionsModalVisible && locationSuggestions.length > 0 && (
        <View style={styles.modalOverlay}>
            <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
                setSuggestionsModalVisible(false);
                setLocationSuggestions([]);
            }}
            >
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <TouchableOpacity 
                    onPress={() => {
                    setSuggestionsModalVisible(false);
                    setLocationSuggestions([]);
                    }}
                    style={styles.closeButton}
                >
                    <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalList}>
                {locationSuggestions.map((item) => (
                    <TouchableOpacity
                    key={item.place_id}
                    style={styles.suggestionItem}
                    onPress={() => handleLocationSelect(item)}
                    >
                    <Ionicons name="location-outline" size={20} color="#666" />
                    <Text style={styles.suggestionText}>{item.description}</Text>
                    </TouchableOpacity>
                ))}
                </ScrollView>
            </View>
            </TouchableOpacity>
        </View>
        )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#0B8457',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#F0F0F0',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#0B8457',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  imageHint: {
    fontSize: 14,
    color: '#9B9B9B',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2332',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#1A2332',
  },
  locationInputContainer: {
    position: 'relative',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9B9B9B',
    textAlign: 'right',
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    borderColor: '#0B8457',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#0B8457',
    fontWeight: '600',
  },
  saveLargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B8457',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveLargeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2332',
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: 350,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default EditProfileScreen;