// services/firebaseService.js
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../screens/AIAssistant/utils/constants';

const FirebaseService = {
  // Save conversation to Firestore
  saveConversation: async (conversation) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const conversationRef = doc(firestore, 'users', userId, 'conversations', conversation.id);
      
      const firestoreData = {
        ...conversation,
        lastModified: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(conversationRef, firestoreData, { merge: true });
      
      // Also save to local storage as backup
      await saveToLocalStorage(conversation);
      
      return { success: true };
    } catch (error) {
      // Fallback to local storage only
      await saveToLocalStorage(conversation);
      return { success: false, error: error.message };
    }
  },

  // Get all conversations from Firestore
  getConversations: async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        // Return local storage data if not authenticated
        return await getFromLocalStorage();
      }

      const conversationsRef = collection(firestore, 'users', userId, 'conversations');
      const q = query(conversationsRef, orderBy('lastModified', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const conversations = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          ...data,
          lastModified: data.lastModified?.toDate?.()?.toISOString() || data.lastModified
        });
      });

      // Sync to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      
      return conversations;
    } catch (error) {
      // Fallback to local storage
      return await getFromLocalStorage();
    }
  },

  // Get single conversation
  getConversation: async (conversationId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return await getConversationFromLocal(conversationId);
      }

      const conversationRef = doc(firestore, 'users', userId, 'conversations', conversationId);
      const docSnap = await getDoc(conversationRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          lastModified: data.lastModified?.toDate?.()?.toISOString() || data.lastModified
        };
      }
      
      return await getConversationFromLocal(conversationId);
    } catch (error) {
      return await getConversationFromLocal(conversationId);
    }
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      const userId = auth.currentUser?.uid;
      
      // Delete from Firestore
      if (userId) {
        const conversationRef = doc(firestore, 'users', userId, 'conversations', conversationId);
        await deleteDoc(conversationRef);
      }
      
      // Delete from local storage
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (stored) {
        const conversations = JSON.parse(stored);
        const updated = conversations.filter(c => c.id !== conversationId);
        await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated));
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update conversation (for archive, title changes, etc.)
  updateConversation: async (conversationId, updates) => {
    try {
      const userId = auth.currentUser?.uid;
      
      if (userId) {
        const conversationRef = doc(firestore, 'users', userId, 'conversations', conversationId);
        await updateDoc(conversationRef, {
          ...updates,
          lastModified: serverTimestamp()
        });
      }
      
      // Update local storage
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (stored) {
        const conversations = JSON.parse(stored);
        const index = conversations.findIndex(c => c.id === conversationId);
        if (index !== -1) {
          conversations[index] = {
            ...conversations[index],
            ...updates,
            lastModified: new Date().toISOString()
          };
          await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
        }
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Helper functions
const saveToLocalStorage = async (conversation) => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let conversations = stored ? JSON.parse(stored) : [];
    
    const index = conversations.findIndex(c => c.id === conversation.id);
    if (index !== -1) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (error) {
  }
};

const getFromLocalStorage = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const getConversationFromLocal = async (conversationId) => {
  try {
    const conversations = await getFromLocalStorage();
    return conversations.find(c => c.id === conversationId) || null;
  } catch (error) {
    return null;
  }
};

export default FirebaseService;