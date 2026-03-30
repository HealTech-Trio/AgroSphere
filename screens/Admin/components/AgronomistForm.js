// screens/Admin/AgronomistForm.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addAgronomist, updateAgronomist } from '../../../utils/agronomistService';
import { geocodeAddress, geocodeCity } from '../../../utils/geocodingService';

// Available cities and options
const CITIES = [
  'Johannesburg', 'Pretoria', 'Cape Town', 'Durban', 'Bloemfontein',
  'Port Elizabeth', 'Nelspruit', 'Polokwane', 'Kimberley', 'East London',
  'Rustenburg', 'Pietermaritzburg', 'Upington'
];

const FARM_SPECIALTIES_OPTIONS = [
  'Corn', 'Wheat', 'Soybeans', 'Tomatoes', 'Potatoes', 'Vegetables',
  'Organic Crops', 'Herbs', 'Fruits', 'Rice', 'Cotton', 'Sugarcane',
  'Hybrid Crops', 'Maize', 'Sorghum', 'Sunflower', 'Grapes', 'Wine Crops',
  'Fruit Trees', 'Citrus', 'Apples', 'Pears', 'Permaculture', 'Conservation',
  'Sugar Cane', 'Bananas', 'Tropical Fruits', 'Beans', 'Mixed Farming',
  'Animal Feed', 'Pasture', 'Dairy Crops', 'Lucern', 'Silage', 'Avocados',
  'Mangoes', 'Macadamia', 'Drought Crops', 'Millet', 'Groundnuts',
  'Drought-resistant Crops', 'Quinoa', 'Teff', 'Coastal Crops', 'Flowers',
  'Commercial Maize', 'Community Gardens', 'Date Palms', 'Olives'
];

const LANGUAGE_OPTIONS = [
  'English', 'Afrikaans', 'Zulu', 'Xhosa', 'Sotho', 'Tswana',
  'Northern Sotho', 'Swazi', 'Venda', 'Tsonga', 'Mandarin',
  'Spanish', 'Portuguese', 'French', 'Yoruba', 'Hindi', 'Arabic'
];

export default function AgronomistForm({ agronomist, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    phone: '',
    experience: '',
    city: '',
    available: true,
    rating: '4.5',
    reviews: '0',
    farmSpecialties: [],
    languages: [],
    locationName: '', // This will be the address we geocode
    profileImage: '',
    // Remove latitude/longitude from form - they'll be auto-generated
  });
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showSpecialties, setShowSpecialties] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (agronomist) {
      setFormData({
        name: agronomist.name || '',
        specialty: agronomist.specialty || '',
        phone: agronomist.phone || '',
        experience: agronomist.experience || '',
        city: agronomist.city || '',
        available: agronomist.available !== undefined ? agronomist.available : true,
        rating: agronomist.rating?.toString() || '4.5',
        reviews: agronomist.reviews?.toString() || '0',
        farmSpecialties: agronomist.farmSpecialties || [],
        languages: agronomist.languages || [],
        locationName: agronomist.locationName || '',
        profileImage: agronomist.profileImage || '',
      });
    }
  }, [agronomist]);

  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to select images.');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          profileImage: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          profileImage: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      profileImage: ''
    }));
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleGeocodeLocation = async () => {
    if (!formData.locationName && !formData.city) {
      Alert.alert('Error', 'Please enter a location name or select a city');
      return;
    }

    setGeocoding(true);
    try {
      let coordinates;
      
      // Try to geocode the specific location first
      if (formData.locationName) {
        coordinates = await geocodeAddress(formData.locationName);
      } 
      // Fall back to city geocoding
      else if (formData.city) {
        coordinates = await geocodeCity(formData.city);
      }

      if (coordinates) {
        Alert.alert(
          'Location Found', 
          `Coordinates: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Geocoding Failed', 
        'Could not find coordinates for this location. The agronomist will be saved but may not appear on the map.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.specialty || !formData.phone || !formData.city) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let coordinates = null;

      // Auto-geocode the location when submitting
      if (formData.locationName || formData.city) {
        try {
          if (formData.locationName) {
            coordinates = await geocodeAddress(formData.locationName);
          } else if (formData.city) {
            coordinates = await geocodeCity(formData.city);
          }
        } catch (error) {
          console.warn('Geocoding failed, saving without coordinates:', error);
          // Continue without coordinates - they can be added later
        }
      }

      const submitData = {
        ...formData,
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews),
        farmSpecialties: formData.farmSpecialties,
        languages: formData.languages,
        // Add coordinates if geocoding was successful
        ...(coordinates && {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        })
      };

      if (agronomist) {
        await updateAgronomist(agronomist.id, submitData);
        Alert.alert('Success', 'Agronomist updated successfully');
      } else {
        await addAgronomist(submitData);
        Alert.alert('Success', 'Agronomist added successfully');
      }
      onSubmit();
    } catch (error) {
      Alert.alert('Error', 'Failed to save agronomist');
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      farmSpecialties: prev.farmSpecialties.includes(specialty)
        ? prev.farmSpecialties.filter(s => s !== specialty)
        : [...prev.farmSpecialties, specialty]
    }));
  };

  const toggleLanguage = (language) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>
            {agronomist ? 'Edit Agronomist' : 'Add New Agronomist'}
          </Text>
          {agronomist?.source === 'hardcoded' && (
            <Text style={styles.readOnlyNotice}>
              This is a default agronomist - some fields are read-only
            </Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={handleSubmit} 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <View style={styles.imageSection}>
          {formData.profileImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: formData.profileImage }} 
                style={styles.profileImage}
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Ionicons name="close-circle" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.imagePlaceholder}
              onPress={showImageOptions}
            >
              <Ionicons name="camera" size={32} color="#ccc" />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.imageButtons}>
            <TouchableOpacity 
              style={styles.imageOptionButton}
              onPress={takePhoto}
            >
              <Ionicons name="camera-outline" size={20} color="#0B8457" />
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imageOptionButton}
              onPress={pickImage}
            >
              <Ionicons name="image-outline" size={20} color="#0B8457" />
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Information */}
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Specialty *"
          value={formData.specialty}
          onChangeText={(text) => setFormData(prev => ({ ...prev, specialty: text }))}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          value={formData.phone}
          onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Experience (e.g., 5 years) *"
          value={formData.experience}
          onChangeText={(text) => setFormData(prev => ({ ...prev, experience: text }))}
        />

        {/* Location Section - Updated */}
        <Text style={styles.sectionTitle}>Location</Text>
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>City *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipsContainer}>
              {CITIES.map(city => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.chip,
                    formData.city === city && styles.chipSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, city }))}
                >
                  <Text style={[
                    styles.chipText,
                    formData.city === city && styles.chipTextSelected
                  ]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Specific location (office, farm, address, etc.)"
          value={formData.locationName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, locationName: text }))}
        />

        <TouchableOpacity 
          style={[styles.geocodeButton, geocoding && styles.geocodeButtonDisabled]}
          onPress={handleGeocodeLocation}
          disabled={geocoding}
        >
          {geocoding ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="location-outline" size={20} color="white" />
          )}
          <Text style={styles.geocodeButtonText}>
            {geocoding ? 'Finding Location...' : 'Find on Map'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.geocodeHelp}>
          Enter a specific address or location name. We'll automatically find the coordinates for the map.
        </Text>

        {/* Ratings & Availability */}
        <Text style={styles.sectionTitle}>Ratings & Availability</Text>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextInput
              style={styles.input}
              placeholder="Rating"
              value={formData.rating}
              onChangeText={(text) => setFormData(prev => ({ ...prev, rating: text }))}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <TextInput
              style={styles.input}
              placeholder="Reviews Count"
              value={formData.reviews}
              onChangeText={(text) => setFormData(prev => ({ ...prev, reviews: text }))}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Available for Consultations</Text>
          <Switch
            value={formData.available}
            onValueChange={(value) => setFormData(prev => ({ ...prev, available: value }))}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={formData.available ? '#0B8457' : '#f4f3f4'}
          />
        </View>

        {/* Farm Specialties */}
        <Text style={styles.sectionTitle}>Farm Specialties</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowSpecialties(!showSpecialties)}
        >
          <Text style={styles.toggleButtonText}>
            {formData.farmSpecialties.length} specialties selected
          </Text>
          <Ionicons 
            name={showSpecialties ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>

        {showSpecialties && (
          <View style={styles.optionsGrid}>
            {FARM_SPECIALTIES_OPTIONS.map(specialty => (
              <TouchableOpacity
                key={specialty}
                style={[
                  styles.optionChip,
                  formData.farmSpecialties.includes(specialty) && styles.optionChipSelected
                ]}
                onPress={() => toggleSpecialty(specialty)}
              >
                <Text style={[
                  styles.optionChipText,
                  formData.farmSpecialties.includes(specialty) && styles.optionChipTextSelected
                ]}>
                  {specialty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Languages */}
        <Text style={styles.sectionTitle}>Languages</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowLanguages(!showLanguages)}
        >
          <Text style={styles.toggleButtonText}>
            {formData.languages.length} languages selected
          </Text>
          <Ionicons 
            name={showLanguages ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>

        {showLanguages && (
          <View style={styles.optionsGrid}>
            {LANGUAGE_OPTIONS.map(language => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.optionChip,
                  formData.languages.includes(language) && styles.optionChipSelected
                ]}
                onPress={() => toggleLanguage(language)}
              >
                <Text style={[
                  styles.optionChipText,
                  formData.languages.includes(language) && styles.optionChipTextSelected
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B8457',
  },
  readOnlyNotice: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#0B8457',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    color: '#0B8457',
  },
  // Image Section Styles
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#0B8457',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  imageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imageOptionText: {
    marginLeft: 6,
    color: '#0B8457',
    fontSize: 14,
    fontWeight: '500',
  },
  // Form Input Styles
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  // Location Picker Styles
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#0B8457',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextSelected: {
    color: 'white',
  },
  // Geocoding Styles
  geocodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  geocodeButtonDisabled: {
    opacity: 0.6,
  },
  geocodeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  geocodeHelp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  // Switch Styles
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  // Toggle Styles
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#333',
  },
  // Options Grid Styles
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  optionChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipSelected: {
    backgroundColor: '#0B8457',
  },
  optionChipText: {
    fontSize: 14,
    color: '#666',
  },
  optionChipTextSelected: {
    color: 'white',
  },
});