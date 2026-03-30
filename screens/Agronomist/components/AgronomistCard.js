import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AnonymousImage from '../../../assets/Images/anonymous.png';

const AgronomistCard = ({ agronomist, onPress }) => {
  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleMessage = (phoneNumber) => {
    Linking.openURL(`sms:${phoneNumber}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <Image
  source={ agronomist.profileImage ? { uri: agronomist.profileImage }: AnonymousImage } style={styles.profileImage} />
        
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{agronomist.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{agronomist.rating}</Text>
              <Text style={styles.reviews}>({agronomist.reviews})</Text>
            </View>
          </View>
          
          <Text style={styles.specialty}>{agronomist.specialty}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={12} color="#666" />
              <Text style={styles.detailText}>{agronomist.distance}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="time" size={12} color="#666" />
              <Text style={styles.detailText}>{agronomist.experience}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons 
                name="radio-button-on" 
                size={12} 
                color={agronomist.available ? '#0B8457' : '#999'} 
              />
              <Text style={styles.detailText}>
                {agronomist.available ? 'Available' : 'Busy'}
              </Text>
            </View>
          </View>
          
          <View style={styles.specialtiesContainer}>
            {agronomist.farmSpecialties.slice(0, 3).map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      <View style={styles.contactButtons}>
        <TouchableOpacity 
          style={[styles.contactButton, styles.callButton]}
          onPress={() => handleCall(agronomist.phone)}
        >
          <Ionicons name="call" size={16} color="white" />
          <Text style={styles.contactButtonText}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.contactButton, styles.messageButton]}
          onPress={() => handleMessage(agronomist.phone)}
        >
          <Ionicons name="chatbubble" size={16} color="white" />
          <Text style={styles.contactButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A2332',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 10,
    color: '#9B9B9B',
    marginLeft: 2,
  },
  specialty: {
    fontSize: 14,
    color: '#0B8457',
    fontWeight: '500',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: '#0B8457',
    fontWeight: '500',
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  callButton: {
    backgroundColor: '#0B8457',
  },
  messageButton: {
    backgroundColor: '#3B82F6',
  },
  contactButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default AgronomistCard;