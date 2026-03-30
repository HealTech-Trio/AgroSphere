// screens/AIAssistant/utils/constants.js

export const STORAGE_KEYS = {
  CONVERSATIONS: '@smart_chat_conversations',
  USER_PREFERENCES: '@smart_chat_preferences',
  MEDIA_CACHE: '@smart_chat_media',
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  MULTIMODAL: 'multimodal',
};

export const SORT_OPTIONS = {
  RECENT: 'recent',
  ALPHABETICAL: 'alphabetical',
  OLDEST: 'oldest',
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop();
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};