// screens/Onboarding/FarmSetupScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { firestore, auth } from '../../firebase';
import CONFIG from '../../config';

const GOOGLE_PLACES_API_KEY = CONFIG.GOOGLE_MAPS_API_KEY;
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

const FarmSetupScreen = ({ navigation }) => {
  const [farmData, setFarmData] = useState({
    name: '',
    size: '',
    location: '',
    cropType: '',
    soilType: '',
    irrigation: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  // Fetch location suggestions
  const fetchLocationSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Check if API key is configured
    if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.warn('Google Maps API key not configured. Please add your API key to FarmSetupScreen.js');
      return;
    }

    setIsFetchingLocations(true);
    try {
      const response = await fetch(
        `${GOOGLE_PLACES_API_URL}?input=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&types=geocode`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        setLocationSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        console.log('Google Places API response:', data.status);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
    setIsFetchingLocations(false);
  };

  // Debounce the API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationQuery) {
        fetchLocationSuggestions(locationQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [locationQuery]);

  // Handle location selection
  const handleLocationSelect = (location) => {
    setFarmData(prev => ({ ...prev, location: location.description }));
    setLocationQuery(location.description);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // Handle location input change
  const handleLocationChange = (text) => {
    setLocationQuery(text);
    setFarmData(prev => ({ ...prev, location: text }));
    
    if (text.length === 0) {
      setShowSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  // Clear suggestions when tapping outside
  const handleOutsideTap = () => {
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleSaveFarm = async () => {
    if (!farmData.name.trim()) {
      Alert.alert('Error', 'Please enter a farm name');
      return;
    }

    if (!farmData.size.trim()) {
      Alert.alert('Error', 'Please enter farm size');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const farmRef = await addDoc(collection(firestore, 'users', user.uid, 'farms'), {
        ...farmData,
        createdAt: new Date(),
        isPrimary: true,
      });

      await setDoc(doc(firestore, 'users', user.uid), {
        onboardingCompleted: true,
        hasFarms: true,
        primaryFarmId: farmRef.id,
      }, { merge: true });

      Alert.alert('Success', 'Farm details saved successfully!');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      
    } catch (error) {
      console.error('Error saving farm:', error);
      Alert.alert('Error', 'Failed to save farm details. Please try again.');
    }
    setLoading(false);
  };

  const handleSkip = () => {
    const user = auth.currentUser;
    if (user) {
      setDoc(doc(firestore, 'users', user.uid), {
        onboardingCompleted: true,
        hasFarms: false,
      }, { merge: true }).then(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
      }).catch(error => {
        console.error('Error updating user:', error);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  // Render location suggestion item
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleLocationSelect(item)}
    >
      <Ionicons name="location-outline" size={20} color="#666" />
      <Text style={styles.suggestionText}>{item.description}</Text>
    </TouchableOpacity>
  );

  // Main form content
  const renderForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Farm Name *</Text>
        <TextInput
          style={styles.input}
          value={farmData.name}
          onChangeText={(text) => setFarmData(prev => ({ ...prev, name: text }))}
          placeholder="Enter your farm name"
          placeholderTextColor="#9B9B9B"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Farm Size *</Text>
        <TextInput
          style={styles.input}
          value={farmData.size}
          onChangeText={(text) => setFarmData(prev => ({ ...prev, size: text }))}
          placeholder="e.g., 50 hectares"
          placeholderTextColor="#9B9B9B"
          keyboardType="numeric"
        />
      </View>

      <View style={[styles.inputGroup, { zIndex: 1000 }]}>
        <Text style={styles.label}>Location</Text>
        <View style={styles.locationInputContainer}>
          <TextInput
            style={styles.input}
            value={locationQuery}
            onChangeText={handleLocationChange}
            placeholder="Start typing your location..."
            placeholderTextColor="#9B9B9B"
            onFocus={() => locationQuery.length >= 3 && setShowSuggestions(true)}
          />
          {isFetchingLocations && (
            <View style={styles.loadingIndicator}>
              <Ionicons name="search" size={20} color="#999" />
            </View>
          )}
        </View>
        
        {showSuggestions && locationSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={locationSuggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item) => item.place_id}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            />
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Crop Type</Text>
        <TextInput
          style={styles.input}
          value={farmData.cropType}
          onChangeText={(text) => setFarmData(prev => ({ ...prev, cropType: text }))}
          placeholder="e.g., Maize, Wheat, Vegetables"
          placeholderTextColor="#9B9B9B"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Soil Type</Text>
        <TextInput
          style={styles.input}
          value={farmData.soilType}
          onChangeText={(text) => setFarmData(prev => ({ ...prev, soilType: text }))}
          placeholder="e.g., Loamy, Sandy, Clay"
          placeholderTextColor="#9B9B9B"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Irrigation System</Text>
        <TextInput
          style={styles.input}
          value={farmData.irrigation}
          onChangeText={(text) => setFarmData(prev => ({ ...prev, irrigation: text }))}
          placeholder="e.g., Drip, Sprinkler, Flood"
          placeholderTextColor="#9B9B9B"
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, loading && styles.buttonDisabled]} 
        onPress={handleSaveFarm}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : 'Save & Continue'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={handleSkip}
      >
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={handleOutsideTap}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Setup Your Farm</Text>
          <Text style={styles.headerSubtitle}>Tell us about your farm to get personalized recommendations</Text>
        </View>

        {/* Use FlatList instead of ScrollView to avoid nesting VirtualizedLists */}
        <FlatList
          data={[1]} // Single item array
          keyExtractor={() => 'form'}
          renderItem={renderForm}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 1,
  },
  inputGroup: {
    marginBottom: 20,
    zIndex: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    flex: 1,
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
  saveButton: {
    backgroundColor: '#0B8457',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default FarmSetupScreen;