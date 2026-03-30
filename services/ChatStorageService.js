// services/ChatStorageService.js - AgriSphere Chat Persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONVERSATIONS_KEY = '@agrisphere_conversations';
const MESSAGES_KEY_PREFIX = '@agrisphere_messages_';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export class ChatStorageService {
  // ─── Conversations ───────────────────────
  static async getConversations() {
    try {
      const data = await AsyncStorage.getItem(CONVERSATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  static async saveConversation(conversation) {
    try {
      const conversations = await this.getConversations();
      const index = conversations.findIndex(c => c.id === conversation.id);

      if (index >= 0) {
        conversations[index] = { ...conversations[index], ...conversation };
      } else {
        conversations.unshift(conversation);
      }

      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
      return conversation;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  static async createConversation(title = 'New Conversation') {
    const conversation = {
      id: generateId(),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: '',
      messageCount: 0,
      archived: false,
    };

    await this.saveConversation(conversation);
    return conversation;
  }

  static async updateConversation(conversationId, updates) {
    try {
      const conversations = await this.getConversations();
      const index = conversations.findIndex(c => c.id === conversationId);

      if (index >= 0) {
        conversations[index] = {
          ...conversations[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
        return conversations[index];
      }
      return null;
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  static async deleteConversation(conversationId) {
    try {
      const conversations = await this.getConversations();
      const filtered = conversations.filter(c => c.id !== conversationId);
      await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));

      // Also delete messages for this conversation
      await AsyncStorage.removeItem(MESSAGES_KEY_PREFIX + conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  static async archiveConversation(conversationId, archived = true) {
    return this.updateConversation(conversationId, { archived });
  }

  // ─── Messages ────────────────────────────
  static async getMessages(conversationId) {
    try {
      const data = await AsyncStorage.getItem(MESSAGES_KEY_PREFIX + conversationId);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  static async addMessage(conversationId, message) {
    try {
      const messages = await this.getMessages(conversationId);
      const newMessage = {
        id: generateId(),
        ...message,
        timestamp: new Date().toISOString(),
      };

      messages.push(newMessage);
      await AsyncStorage.setItem(
        MESSAGES_KEY_PREFIX + conversationId,
        JSON.stringify(messages)
      );

      // Update conversation metadata
      await this.updateConversation(conversationId, {
        lastMessage: message.text?.substring(0, 100) || 'Media message',
        messageCount: messages.length,
      });

      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  static async clearMessages(conversationId) {
    try {
      await AsyncStorage.removeItem(MESSAGES_KEY_PREFIX + conversationId);
      await this.updateConversation(conversationId, {
        lastMessage: '',
        messageCount: 0,
      });
    } catch (error) {
      console.error('Error clearing messages:', error);
      throw error;
    }
  }

  // ─── Utility ─────────────────────────────
  static async clearAllData() {
    try {
      const conversations = await this.getConversations();
      const keys = conversations.map(c => MESSAGES_KEY_PREFIX + c.id);
      keys.push(CONVERSATIONS_KEY);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing all chat data:', error);
      throw error;
    }
  }
}
