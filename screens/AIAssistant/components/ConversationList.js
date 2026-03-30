// screens/AIAssistant/components/ConversationList.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  Easing
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ConversationCard from './ConversationCard';

const ConversationList = ({
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onArchiveConversation,
  insets,
  isLoading,
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Loader animations
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      fadeAnim.setValue(1);
      // Continuous spin animation
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [onRefresh]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="chat-outline" size={80} color="#D0D0D0" />
      <Text style={styles.emptyTitle}>No Conversations Yet</Text>
      <Text style={styles.emptyDescription}>
        Start a new chat to begin your AI-powered agricultural journey
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
      <View style={styles.loaderContent}>
        {/* Spinning outer circle */}
        <Animated.View style={[
          styles.spinnerOuter,
          { transform: [{ rotate: spin }] }
        ]}>
          <View style={styles.spinnerSegment1} />
          <View style={styles.spinnerSegment2} />
          <View style={styles.spinnerSegment3} />
        </Animated.View>
        
        {/* Pulsing center icon */}
        <Animated.View style={[
          styles.centerIcon,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <MaterialCommunityIcons 
            name="robot-happy-outline" 
            size={36} 
            color="#0B8457" 
          />
        </Animated.View>
      </View>
      
      <Text style={styles.loadingText}>Loading conversations...</Text>
      <View style={styles.loadingDots}>
        <Animated.View style={[styles.dot, { 
          opacity: pulseAnim.interpolate({
            inputRange: [1, 1.2],
            outputRange: [0.3, 1]
          })
        }]} />
        <Animated.View style={[styles.dot, { 
          opacity: pulseAnim.interpolate({
            inputRange: [1, 1.2],
            outputRange: [0.5, 1]
          })
        }]} />
        <Animated.View style={[styles.dot, { 
          opacity: pulseAnim.interpolate({
            inputRange: [1, 1.2],
            outputRange: [0.7, 1]
          })
        }]} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        renderLoadingState()
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              onPress={() => onSelectConversation(item)}
              onDelete={() => onDeleteConversation(item.id)}
              onArchive={() => onArchiveConversation(item.id)}
            />
          )}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0B8457"
              colors={['#0B8457']}
            />
          }
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 280,

  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2332',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    backgroundColor: '#F5F7FA',
  },
  loaderContent: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  spinnerOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerSegment1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#0B8457',
    borderRightColor: '#0B8457',
  },
  spinnerSegment2: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'transparent',
    borderBottomColor: '#7ED957',
    borderLeftColor: '#7ED957',
  },
  spinnerSegment3: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#A8E890',
  },
  centerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 17,
    color: '#0B8457',
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0B8457',
  },
});

export default ConversationList;