// screens/Analysis/components/AnalysisToolCard.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MaterialCommunityIcons, 
  FontAwesome5,
  MaterialIcons,
  Ionicons,
  FontAwesome
} from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48) / 2; // 20px padding + 8px gap

const AnalysisToolCard = ({ tool, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const getIcon = () => {
    const iconProps = {
      size: 28,
      color: 'white',
    };

    switch (tool.iconFamily) {
      case 'FontAwesome5':
        return <FontAwesome5 name={tool.icon} {...iconProps} />;
      case 'MaterialIcons':
        return <MaterialIcons name={tool.icon} {...iconProps} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={tool.icon} {...iconProps} />;
      default:
        return <Ionicons name={tool.icon} {...iconProps} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
        index % 2 === 1 && styles.rightCard,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.touchable}
      >
        <View style={styles.card}>
          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <FontAwesome5 name="crown" size={12} color="#FFD700" />
            <Text style={styles.premiumText}>Pro</Text>
          </View>

          {/* Icon Section */}
          <View style={styles.iconSection}>
            <LinearGradient
              colors={tool.gradient}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {getIcon()}
            </LinearGradient>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {tool.title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {tool.description}
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: tool.color }]}
            onPress={onPress}
          >
            <Text style={styles.actionText}>{tool.actionText}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  rightCard: {
    marginLeft: 8,
  },
  touchable: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  premiumText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '600',
    marginLeft: 4,
  },
  iconSection: {
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 60,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#667',
    lineHeight: 16,
    textAlign: 'center',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AnalysisToolCard;