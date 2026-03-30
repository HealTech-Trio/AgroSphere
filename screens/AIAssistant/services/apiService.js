// screens/AIAssistant/services/apiService.js
import axios from 'axios';

const API_BASE_URL = 'http://192.168.68.115:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
  headers: {
    'Accept': 'application/json',
  },
});

const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  SERVER: 'SERVER_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

const parseError = (error) => {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      type: ErrorTypes.TIMEOUT,
      message: 'The request took too long. Please try again with a smaller file or shorter message.',
      technicalError: error.message,
    };
  }

  if (error.code === 'ERR_NETWORK' || !error.response) {
    return {
      type: ErrorTypes.NETWORK,
      message: 'Unable to connect to the AI service. Please check your internet connection and ensure you are on the same network as the server.',
      technicalError: error.message,
    };
  }

  if (error.response) {
    const { status, data } = error.response;

    if (data && data.response) {
      return {
        type: ErrorTypes.SERVER,
        message: data.response,
        technicalError: data.error || 'Server error',
        statusCode: status,
      };
    }

    switch (status) {
      case 400:
        return {
          type: ErrorTypes.VALIDATION,
          message: data?.error || 'Invalid request. Please check your input and try again.',
          technicalError: data?.error || 'Bad Request',
          statusCode: status,
        };

      case 401:
      case 403:
        return {
          type: ErrorTypes.SERVER,
          message: 'Authentication error. Please check your API key configuration.',
          technicalError: 'Unauthorized',
          statusCode: status,
        };

      case 404:
        return {
          type: ErrorTypes.SERVER,
          message: 'Service endpoint not found. Please check your server configuration.',
          technicalError: 'Not Found',
          statusCode: status,
        };

      case 413:
        return {
          type: ErrorTypes.VALIDATION,
          message: 'Your file is too large. Please try with a smaller file.',
          technicalError: 'Payload Too Large',
          statusCode: status,
        };

      case 429:
        return {
          type: ErrorTypes.SERVER,
          message: 'Too many requests. Please wait a moment and try again.',
          technicalError: 'Rate Limit Exceeded',
          statusCode: status,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorTypes.SERVER,
          message: data?.response || 'The AI service is temporarily unavailable. Please try again in a moment.',
          technicalError: data?.error || 'Server Error',
          statusCode: status,
        };

      default:
        return {
          type: ErrorTypes.SERVER,
          message: data?.response || 'An unexpected error occurred. Please try again.',
          technicalError: data?.error || `HTTP ${status}`,
          statusCode: status,
        };
    }
  }

  return {
    type: ErrorTypes.UNKNOWN,
    message: 'An unexpected error occurred. Please try again.',
    technicalError: error.message || 'Unknown error',
  };
};

const validateMessageData = (messageData) => {
  if (!messageData) {
    throw new Error('Message data is required');
  }

  const { type, text, images, audioUri } = messageData;

  const hasText = text && text.trim().length > 0;
  const hasImages = images && images.length > 0;
  const hasAudio = audioUri && audioUri.length > 0;

  if (!hasText && !hasImages && !hasAudio) {
    throw new Error('Message must contain text, image, or audio');
  }

  if (hasImages) {
    for (const image of images) {
      if (!image.uri) {
        throw new Error('Invalid image: missing URI');
      }
    }
  }

  return true;
};

const createFormData = (messageData, conversationId) => {
  const formData = new FormData();

  if (conversationId) {
    formData.append('conversation_id', conversationId);
  }

  if (messageData.text && messageData.text.trim()) {
    formData.append('message', messageData.text.trim());
  }

  switch (messageData.type) {
    case 'image':
      if (messageData.images && messageData.images.length > 0) {
        const image = messageData.images[0];
        const imageFile = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `image_${Date.now()}.jpg`,
        };
        formData.append('image', imageFile);
      }
      break;

    case 'audio':
      if (messageData.audioUri) {
        const audioFile = {
          uri: messageData.audioUri,
          type: 'audio/webm',
          name: `audio_${Date.now()}.webm`,
        };
        formData.append('audio', audioFile);
      }
      break;

    case 'multimodal':
      if (messageData.images && messageData.images.length > 0) {
        const image = messageData.images[0];
        const imageFile = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `image_${Date.now()}.jpg`,
        };
        formData.append('image', imageFile);
      }

      if (messageData.audioUri) {
        const audioFile = {
          uri: messageData.audioUri,
          type: 'audio/webm',
          name: `audio_${Date.now()}.webm`,
        };
        formData.append('audio', audioFile);
      }
      break;

    case 'text':
    default:
      break;
  }

  return formData;
};

export const sendMessageToAI = async (messageData, conversationId) => {
  try {
    validateMessageData(messageData);

    const formData = createFormData(messageData, conversationId);

    const response = await apiClient.post('/api/chatbot', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data) {
      throw new Error('Empty response from server');
    }

    if (response.data.status === 'error') {
      return {
        success: false,
        error: response.data.error || 'unknown_error',
        message: response.data.response || 'An error occurred while processing your request.',
        data: response.data,
      };
    }

    return {
      success: true,
      data: {
        response: response.data.response,
        conversation_id: response.data.conversation_id,
        conversation_title: response.data.conversation_title,
        processing_time: response.data.processing_time,
        grounding_metadata: response.data.grounding_metadata,
      },
      message: null,
      error: null,
    };

  } catch (error) {
    const parsedError = parseError(error);

    return {
      success: false,
      error: parsedError.type,
      message: parsedError.message,
      technicalError: parsedError.technicalError,
      statusCode: parsedError.statusCode,
      data: null,
    };
  }
};

export const testConnection = async () => {
  try {
    const response = await apiClient.get('/health', {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const clearChatSession = async (conversationId) => {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const response = await apiClient.post('/api/clear_session', {
      conversation_id: conversationId,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      success: response.data.status === 'success',
      message: response.data.message,
    };

  } catch (error) {
    const parsedError = parseError(error);
    return {
      success: false,
      error: parsedError.type,
      message: parsedError.message,
    };
  }
};

export { ErrorTypes };

export default {
  sendMessageToAI,
  testConnection,
  clearChatSession,
  ErrorTypes,
};