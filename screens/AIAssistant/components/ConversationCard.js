// screens/AIAssistant/components/ConversationCard.js
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { formatDate } from '../utils/helpers';

const ConversationCard = ({ conversation, onPress, onDelete, onArchive }) => {
  const swipeableRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => onPress());
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(),
        },
      ]
    );
  };

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeAction, styles.archiveAction]}
        onPress={() => {
          swipeableRef.current?.close();
          onArchive();
        }}
      >
        <Ionicons 
          name={conversation.isArchived ? "archive-outline" : "archive"} 
          size={24} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeAction, styles.deleteAction]}
        onPress={() => {
          swipeableRef.current?.close();
          confirmDelete();
        }}
      >
        <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const getConversationIcon = () => {
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];
    if (lastMessage?.type === 'image') return 'image-outline';
    if (lastMessage?.type === 'audio') return 'mic-outline';
    return 'chatbubble-ellipses-outline';
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.container}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <View style={[
              styles.iconBackground,
              conversation.isArchived && styles.archivedIconBackground
            ]}>
              <Ionicons
                name={getConversationIcon()}
                size={24}
                color={conversation.isArchived ? '#B8860B' : '#0B8457'}
              />
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {conversation.title}
              </Text>
              <Text style={styles.time}>
                {formatDate(conversation.lastModified)}
              </Text>
            </View>

            {conversation.messages?.length > 0 && (
              <Text style={styles.preview} numberOfLines={2}>
                {conversation.messages[conversation.messages.length - 1].text || 
                 (conversation.messages[conversation.messages.length - 1].type === 'image' ? '📷 Image' : '🎤 Voice message')}
              </Text>
            )}

            <View style={styles.footer}>
              <View style={styles.badges}>
                {conversation.messages?.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                {conversation.isArchived && (
                  <View style={[styles.badge, styles.archivedBadge]}>
                    <Text style={[styles.badgeText, styles.archivedBadgeText]}>Archived</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Swipeable>
  );
};




// Component Styles
const styles = StyleSheet.create({
  // ConversationCard styles
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedIconBackground: {
    backgroundColor: 'rgba(184, 134, 11, 0.1)',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#9B9B9B',
  },
  preview: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  archivedBadge: {
    backgroundColor: '#FFE5B4',
  },
  archivedBadgeText: {
    color: '#B8860B',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    width: 70,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveAction: {
    backgroundColor: '#FFA500',
  },
  deleteAction: {
    backgroundColor: '#FF4444',
  },

  // AudioRecorder styles
  recordingContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    padding: 16,
  },
  recordingBackground: {
    borderRadius: 12,
    padding: 16,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginBottom: 16,
    gap: 3,
  },
  wave: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B8457',
    textAlign: 'center',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },

  // AudioPlayer styles
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minWidth: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11, 132, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  audioInfo: {
    flex: 1,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 20,
    marginBottom: 4,
  },
  waveformBar: {
    width: 2,
    borderRadius: 1,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#0B8457',
    borderRadius: 1,
  },
  audioDuration: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 4,
  },
  userAudioDuration: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default ConversationCard;