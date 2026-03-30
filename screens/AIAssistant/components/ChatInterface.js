// screens/AIAssistant/components/ChatInterface.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Animated,
  StatusBar,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { generateUniqueId } from '../utils/helpers';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import ApiService from '../../../services/api'; 
import FirebaseService from '../../../services/firebaseService';
import AgriSphereLogo from '../../../assets/Images/Logo_c.png';

const ChatInterface = ({
  conversation,
  onBack,
  onUpdateConversation,
  insets,
  navigation
}) => {
  const [messages, setMessages] = useState(conversation?.messages || []);
  const [conversationTitle, setConversationTitle] = useState(conversation?.title || 'New Conversation');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  const conversationRef = useRef(conversation);

  useEffect(() => {
    conversationRef.current = {
      ...conversationRef.current,
      messages,
      title: conversationTitle,
      lastModified: new Date().toISOString()
    };
  }, [messages, conversationTitle]);

  const saveConversationSafely = async (updatedConversation) => {
    try {
      // Save to Firestore + Local Storage
      await FirebaseService.saveConversation(updatedConversation);
      
      // Update parent component
      await onUpdateConversation(updatedConversation);
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSwipe = (event) => {
    try {
      const translationX = event?.nativeEvent?.translationX ?? 0;
      if (translationX > 50) {
        handleBack();
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    navigation?.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => {
      navigation?.getParent()?.setOptions({
        tabBarStyle: undefined
      });
    };
  }, []);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      const animateDot = (anim, delay) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      animateDot(dotAnim1, 0);
      animateDot(dotAnim2, 200);
      animateDot(dotAnim3, 400);
    } else {
      spinAnim.stopAnimation();
      pulseAnim.stopAnimation();
      dotAnim1.stopAnimation();
      dotAnim2.stopAnimation();
      dotAnim3.stopAnimation();
      spinAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isTyping]);

  const sendMessage = async (content) => {
    const newMessage = {
      id: generateUniqueId(),
      ...content,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };


    // Update messages state immediately
    const updatedMessagesWithUser = [...messages, newMessage];
    setMessages(updatedMessagesWithUser);
    
    // Save user message FIRST (wait for it to complete)
    const tempConversation = {
      ...conversationRef.current,
      id: conversation.id,
      title: conversationTitle,
      messages: updatedMessagesWithUser,
      lastModified: new Date().toISOString(),
      createdAt: conversation.createdAt || new Date().toISOString(),
      isArchived: conversation.isArchived || false
    };
    
    await saveConversationSafely(tempConversation);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Then get AI response
    await getAIResponse(content, updatedMessagesWithUser);
  };

  const getAIResponse = async (userMessage, currentMessages) => {
    setIsTyping(true);
    
    let aiResponseMessage = null;
    
    try {
      
      const response = await ApiService.sendChatMessage(userMessage, conversation.id);

      if (response.success && response.data) {
        
        bounceAnim.setValue(0);
        
        aiResponseMessage = {
          id: generateUniqueId(),
          type: 'text',
          text: response.data.response,
          timestamp: new Date().toISOString(),
          sender: 'ai',
          processingTime: response.data.processing_time,
          isError: false
        };

        // Update title if provided
        if (response.data.conversation_title) {
          setConversationTitle(response.data.conversation_title);
        }

        Animated.spring(bounceAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 6,
        }).start();
      } else {
        // API returned error
        
        aiResponseMessage = {
          id: generateUniqueId(),
          type: 'text',
          text: response.message || 'Sorry, I encountered an issue. Please try again.',
          timestamp: new Date().toISOString(),
          sender: 'ai',
          isError: true
        };
      }
    } catch (error) {
      
      aiResponseMessage = {
        id: generateUniqueId(),
        type: 'text',
        text: 'Unable to connect to the AI service. Please check your internet connection and try again.',
        timestamp: new Date().toISOString(),
        sender: 'ai',
        isError: true
      };
    } finally {
      setIsTyping(false);
    }

    if (aiResponseMessage) {
      
      const updatedMessagesWithAI = [...currentMessages, aiResponseMessage];
      
      // Update state
      setMessages(updatedMessagesWithAI);
      
      // Save conversation with AI response
      const finalConversation = {
        ...conversationRef.current,
        id: conversation.id,
        title: conversationTitle,
        messages: updatedMessagesWithAI,
        lastModified: new Date().toISOString(),
        createdAt: conversation.createdAt || new Date().toISOString(),
        isArchived: conversation.isArchived || false
      };
      
      // Save and wait
      await saveConversationSafely(finalConversation);
      
      // Scroll to show new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleBack = async () => {
    // Final save before leaving
    const finalConversation = {
      ...conversationRef.current,
      id: conversation.id,
      title: conversationTitle,
      messages: messages,
      lastModified: new Date().toISOString(),
      createdAt: conversation.createdAt || new Date().toISOString(),
      isArchived: conversation.isArchived || false
    };
    
    await saveConversationSafely(finalConversation);
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onBack();
    });
  };
  
  const renderMessage = ({ item, index }) => (
    <MessageBubble
      message={item}
      isFirstInGroup={index === 0 || messages[index - 1]?.sender !== item.sender}
      isLastInGroup={index === messages.length - 1 || messages[index + 1]?.sender !== item.sender}
      bounceAnim={index === messages.length - 1 && item.sender === 'ai' ? bounceAnim : null}
    />
  );

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingContent}>
          <Animated.View style={[
            styles.spinnerOuter,
            { transform: [{ rotate: spin }] }
          ]}>
            <View style={styles.spinnerSegment1} />
            <View style={styles.spinnerSegment2} />
            <View style={styles.spinnerSegment3} />
          </Animated.View>
          
          <Animated.View style={[
            styles.centerIcon,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <MaterialCommunityIcons 
              name="robot-happy-outline" 
              size={20} 
              color="#0B8457" 
            />
          </Animated.View>
        </View>

        <View style={styles.typingTextContainer}>
          <Text style={styles.typingText}>AI is typing</Text>
          <Animated.Text style={[styles.dot, { opacity: dotAnim1 }]}>.</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dotAnim2 }]}>.</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dotAnim3 }]}>.</Animated.Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['rgba(11, 132, 87, 0.1)', 'rgba(11, 132, 87, 0.05)']}
        style={styles.emptyGradient}
      >
        <MaterialCommunityIcons name="robot-happy-outline" size={64} color="#0B8457" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>Start Your Conversation</Text>
      <Text style={styles.emptyDescription}>
        Ask me anything about agriculture, crops, soil management, or farming techniques!
      </Text>
      
      <View style={styles.suggestionContainer}>
        <Text style={styles.suggestionTitle}>Try asking:</Text>
        {[
          "How can I improve my tomato yield?",
          "What's the best fertilizer for corn?",
          "How to identify pest damage on leaves?"
        ].map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => sendMessage({ type: 'text', text: suggestion })}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler
        onGestureEvent={handleSwipe}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
         <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
         
         <View style={[styles.header, { paddingTop: insets.top }]}>
           <TouchableOpacity
             style={styles.backButton}
             onPress={handleBack}
             activeOpacity={0.7}
           >
             <Ionicons name="arrow-back" size={24} color="#2E2E2E" />
           </TouchableOpacity>
           <View style={styles.logoIcon}>
             <Image source={AgriSphereLogo} style={styles.logo} />
           </View>
           <View style={styles.headerCenter}>
             <View style={styles.brandContainer}>
               <View style={styles.brandTextContainer}>
                 <Text style={styles.brandName}>
                   <Text style={styles.cropText}>Crop</Text>
                   <Text style={styles.mateText}>Mate</Text>
                 </Text>
                 <Text style={styles.aiAssistantText}>AI Assistant</Text>
               </View>
             </View>
             <Text style={styles.conversationTitle} numberOfLines={1}>
               {conversationTitle}
             </Text>
           </View>
           <View style={styles.statusContainer}>
             <View style={[styles.statusDot, isTyping && styles.statusDotActive]} />
             <Text style={[styles.statusText, isTyping && styles.statusTextActive]}>
               {isTyping ? 'Thinking...' : 'Online'}
             </Text>
           </View>
         </View>

         <KeyboardAvoidingView
           style={styles.chatContainer}
           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
           keyboardVerticalOffset={0}
         >
           <FlatList
             ref={flatListRef}
             data={messages}
             keyExtractor={(item) => item.id}
             renderItem={renderMessage}
             ListEmptyComponent={renderEmptyState}
             ListFooterComponent={renderTypingIndicator}
             contentContainerStyle={[
               styles.messagesList,
               messages.length === 0 && styles.emptyMessagesList
             ]}
             showsVerticalScrollIndicator={false}
             onContentSizeChange={() => {
               if (messages.length > 0) {
                 flatListRef.current?.scrollToEnd({ animated: false });
               }
             }}
           />

           <ChatInput
             onSendMessage={sendMessage}
             disabled={isTyping}
           />
         </KeyboardAvoidingView>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
   );
 };

 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#F5F7FA',
   },
   header: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingBottom: 16,
     backgroundColor: '#FFFFFF',
     borderBottomWidth: 1,
     borderBottomColor: '#E8E8E8',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 3,
     elevation: 3,
   },
   backButton: {
     padding: 8,
     marginRight: 12,
   },
   headerCenter: {
     flex: 1,
     alignItems: 'flex-start',
     justifyContent: 'center',
   },
   conversationTitle: {
     fontSize: 19,
     fontWeight: '600',
     color: 'gray',
     marginBottom: -8,
     marginTop: 2,
     marginLeft: 8,
   },
   statusContainer: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   statusDot: {
     width: 7,
     height: 7,
     borderRadius: 3.5,
     backgroundColor: '#0B8457',
     marginRight: 6,
   },
   statusDotActive: {
     backgroundColor: '#FFA500',
   },
   statusText: {
     fontSize: 13,
     color: '#0B8457',
     fontWeight: '500',
   },
   statusTextActive: {
     color: '#FFA500',
   },
   brandContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginLeft: 8,
   },
   logoIcon: {
     width: 60,
     height: 60,
     borderRadius: 11,
     alignItems: 'center',
     justifyContent: 'center',
     marginRight: 8,
     shadowColor: '#0B8457',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.15,
     shadowRadius: 3,
     elevation: 2,
   },
   logo: {
     width: '100%',
     height: '100%',
     borderRadius: 11,
   },
   brandTextContainer: {
     flexDirection: 'column',
     alignItems: 'flex-start',
   },
   brandName: {
     fontSize: 25,
     fontWeight: '800',
     letterSpacing: -0.3,
   },
   cropText: {
     color: '#1A2332',
     fontWeight: '800',
   },
   mateText: {
     color: '#0B8457',
     fontWeight: '800',
   },
   aiAssistantText: {
     fontSize: 10,
     color: '#0B8457',
     fontWeight: '600',
     letterSpacing: 0.5,
     textTransform: 'uppercase',
     marginTop: -1,
   },
   chatContainer: {
     flex: 1,
   },
   messagesList: {
     paddingHorizontal: 16,
     paddingVertical: 16,
   },
   emptyMessagesList: {
     flex: 1,
   },
   emptyState: {
     flex: 1,
     alignItems: 'center',
     justifyContent: 'center',
     paddingHorizontal: 24,
   },
   emptyGradient: {
     width: 120,
     height: 120,
     borderRadius: 60,
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: 12,
   },
   emptyTitle: {
     fontSize: 22,
     fontWeight: '600',
     color: '#1A2332',
     marginBottom: 8,
   },
   emptyDescription: {
     fontSize: 14,
     color: '#6B6B6B',
     textAlign: 'center',
     lineHeight: 20,
     marginBottom: 2,
   },
   suggestionContainer: {
     width: '100%',
     alignItems: 'center',
   },
   suggestionTitle: {
     fontSize: 13,
     color: '#9B9B9B',
     fontWeight: '500',
     marginBottom: 8,
   },
   suggestionChip: {
     backgroundColor: '#FFFFFF',
     paddingHorizontal: 16,
     paddingVertical: 10,
     borderRadius: 20,
     marginBottom: 10,
     borderWidth: 1,
     borderColor: '#E8E8E8',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.05,
     shadowRadius: 2,
     elevation: 1,
   },
   suggestionText: {
     fontSize: 14,
     color: '#0B8457',
     fontWeight: '500',
   },
   typingContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 8,
     paddingVertical: 12,
     marginLeft: -8,
   },
   typingContent: {
     width: 50,
     height: 50,
     alignItems: 'center',
     justifyContent: 'center',
     marginRight: 12,
   },
   spinnerOuter: {
     position: 'absolute',
     width: 50,
     height: 50,
     alignItems: 'center',
     justifyContent: 'center',
   },
   spinnerSegment1: {
     position: 'absolute',
     width: 50,
     height: 50,
     borderRadius: 25,
     borderWidth: 3,
     borderColor: 'transparent',
     borderTopColor: '#0B8457',
     borderRightColor: '#0B8457',
   },
   spinnerSegment2: {
     position: 'absolute',
     width: 36,
     height: 36,
     borderRadius: 18,
     borderWidth: 2.5,
     borderColor: 'transparent',
     borderBottomColor: '#7ED957',
     borderLeftColor: '#7ED957',
   },
   spinnerSegment3: {
     position: 'absolute',
     width: 22,
     height: 22,
     borderRadius: 11,
     borderWidth: 2,
     borderColor: 'transparent',
     borderTopColor: '#A8E890',
   },
   centerIcon: {
     alignItems: 'center',
     justifyContent: 'center',
     zIndex: 10,
   },
   typingTextContainer: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   typingText: {
     fontSize: 14,
     color: '#0B8457',
     fontWeight: '600',
   },
   dot: {
     fontSize: 18,
     color: '#0B8457',
     fontWeight: 'bold',
     marginLeft: 1,
   },
 });

 export default ChatInterface;