// screens/MyCrops/components/CropCard.js
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CROP_TYPES } from '../utils/constants';

// Import crop images
import cerealsImage from '../CropImages/Cereals.jpeg';
import vegetablesImage from '../CropImages/Vegetables.jpeg';
import fruitsImage from '../CropImages/fruits.jpeg';
import legumesImage from '../CropImages/Legumes.jpeg';
import rootCropsImage from '../CropImages/Root_Crops.jpeg';
import oilseedsImage from '../CropImages/Oilseeds.png';
import fiberCropsImage from '../CropImages/Fiber.png';
import sugarCropsImage from '../CropImages/Sugar.jpeg';
import forageCropsImage from '../CropImages/Forage.png';
import herbsSpicesImage from '../CropImages/Basil.jpeg';

// Map crop types to their images
const CROP_IMAGES = {
  cereals: cerealsImage,
  vegetables: vegetablesImage,
  fruits: fruitsImage,
  legumes: legumesImage,
  root_crops: rootCropsImage,
  oilseeds: oilseedsImage,
  fiber_crops: fiberCropsImage,
  sugar_crops: sugarCropsImage,
  forage_crops: forageCropsImage,
  herbs_spices: herbsSpicesImage,
};

const CropCard = ({ 
  crop, 
  viewMode = 'list',
  onEdit, 
  onDelete, 
  onPress 
}) => {
  const getProgressBarColor = (percentage) => {
    if (percentage === 100) return '#10B981'; // Green for completed crops
    if (percentage < 20) return '#EF4444';
    if (percentage < 50) return '#F59E0B';
    return '#3B82F6'; // Blue for late stage
  };

  const getCropTypeInfo = () => {
    return Object.values(CROP_TYPES).find(type => type.id === crop.cropType) || CROP_TYPES.VEGETABLES;
  };

  const cropTypeInfo = getCropTypeInfo();
  const glowColor = cropTypeInfo.color;
  const cropImage = CROP_IMAGES[crop.cropType];
  const isCompleted = crop.growthStage === 100;

  const ProgressBar = ({ value }) => {
    const progressColor = getProgressBarColor(value);
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${value}%`,
                backgroundColor: progressColor
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Outer Glow Container */}
      <View style={[
        styles.glowContainer,
        { 
          shadowColor: isCompleted ? '#10B981' : glowColor, // Green glow for completed
          backgroundColor: 'transparent'
        }
      ]}>
        {/* Main Card Content */}
        <View style={styles.card}>
          {/* Crop Image Section */}
          <View style={styles.imageSection}>
            {cropImage ? (
              <Image 
                source={cropImage} 
                style={styles.cropImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: cropTypeInfo.color + '20' }]}>
                <MaterialCommunityIcons 
                  name={cropTypeInfo.icon} 
                  size={32} 
                  color={cropTypeInfo.color} 
                />
              </View>
            )}
            
            {/* Completion Badge Overlay */}
            {isCompleted && (
              <View style={styles.completionBadge}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
                <Text style={styles.completionText}>Ready for Harvest</Text>
              </View>
            )}
            
            {/* Growth Stage Overlay */}
            <View style={styles.growthOverlay}>
              <Text style={styles.growthOverlayText}>{crop.growthStage}%</Text>
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Header with Crop Type Badge */}
            <View style={styles.headerSection}>
              <View style={[styles.cropTypeBadge, { backgroundColor: cropTypeInfo.color + '15' }]}>
                <MaterialCommunityIcons 
                  name={cropTypeInfo.icon} 
                  size={12} 
                  color={cropTypeInfo.color} 
                />
                <Text style={[styles.cropTypeBadgeText, { color: cropTypeInfo.color }]}>
                  {cropTypeInfo.name}
                </Text>
              </View>
              
              {/* Status Indicator */}
              <View style={styles.statusIndicator}>
                <View 
                  style={[
                    styles.statusDot,
                    { backgroundColor: getProgressBarColor(crop.growthStage) }
                  ]} 
                />
                <Text style={styles.statusText}>
                  {crop.growthStage < 50 ? 'Early' : crop.growthStage < 100 ? 'Late' : 'Completed'}
                </Text>
              </View>
            </View>

            {/* Crop Name & Farm */}
            <View style={styles.titleSection}>
              <View style={styles.titleRow}>
                <MaterialCommunityIcons name="sprout" size={16} color="#0B8457" />
                <Text style={styles.cropName} numberOfLines={1}>
                  {crop.cropName}
                </Text>
              </View>
              
              <View style={styles.farmRow}>
                <Ionicons name="business-outline" size={12} color="#6B7280" />
                <Text style={styles.farmText} numberOfLines={1}>
                  {crop.farmName}
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="texture-box" size={14} color="#8B5CF6" />
                <Text style={styles.statValue}>{crop.area} ha</Text>
                <Text style={styles.statLabel}>Area</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="chart-line" size={14} color="#10B981" />
                <Text style={styles.statValue}>{crop.growthStage}%</Text>
                <Text style={styles.statLabel}>Growth</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.growthSection}>
              <ProgressBar value={crop.growthStage} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => onEdit(crop)}
              >
                <Ionicons name="create-outline" size={16} color="#2196F3" />
                <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
              </TouchableOpacity>
              
              <View style={styles.actionDivider} />
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete(crop)}
              >
                <Ionicons name="trash-outline" size={16} color="#F44336" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
  },
  glowContainer: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    overflow: 'hidden',
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  imageSection: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981', // Green for completed
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  completionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  growthOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  cropTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  titleSection: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  farmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farmText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  growthSection: {
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editButtonText: {
    color: '#2196F3',
  },
  deleteButtonText: {
    color: '#F44336',
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
});

export default CropCard;