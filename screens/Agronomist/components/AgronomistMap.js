import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AgronomistMap = ({ agronomists, selectedAgronomist, onMarkerPress }) => {
  const initialRegion = {
    latitude: -26.1885,
    longitude: 28.3206,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {agronomists.map((agronomist) => (
          <Marker
            key={agronomist.id}
            coordinate={{
              latitude: agronomist.latitude,
              longitude: agronomist.longitude
            }}
            title={agronomist.name}
            description={agronomist.specialty}
            onPress={() => onMarkerPress(agronomist)}
          >
            <View style={[
              styles.marker, 
              { 
                backgroundColor: agronomist.available ? '#0B8457' : '#9B9B9B',
                borderColor: selectedAgronomist?.id === agronomist.id ? '#2E2E2E' : 'transparent'
              }
            ]}>
              <MaterialCommunityIcons name="sprout" size={16} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '120%',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});

export default AgronomistMap;