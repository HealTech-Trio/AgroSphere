// utils/geocodingService.js
import * as Location from 'expo-location';

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map();

export const geocodeAddress = async (address) => {
  try {
    // Check cache first
    if (geocodingCache.has(address)) {
      return geocodingCache.get(address);
    }

    console.log('Geocoding address:', address);
    
    // Request permission (if not already granted)
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Geocode the address
    const results = await Location.geocodeAsync(address);
    
    if (results.length === 0) {
      throw new Error('Address not found');
    }

    const location = results[0];
    const coordinates = {
      latitude: location.latitude,
      longitude: location.longitude
    };

    // Cache the result
    geocodingCache.set(address, coordinates);
    
    console.log('Geocoding successful:', coordinates);
    return coordinates;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

// Get coordinates for a city name
export const geocodeCity = async (city) => {
  // Add South Africa context for better results
  const address = `${city}, South Africa`;
  return geocodeAddress(address);
};

// Clear cache if needed
export const clearGeocodingCache = () => {
  geocodingCache.clear();
};