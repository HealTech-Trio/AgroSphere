// services/api.js

const API_CONFIG = {
  BASE_URL: 'http://10.0.0.114:5000', 
  TIMEOUT: 90000,
};

// API Endpoints
const ENDPOINTS = {
  // Chatbot endpoints
  CHATBOT: '/api/chatbot',
  CLEAR_SESSION: '/api/clear_session',
  HEALTH_CHECK: '/health',
  
  // Analysis endpoints
  DISEASE_DETECTION: '/api/analyze',
  SOIL_ASSESSMENT: '/api/soil-assessment',
  YIELD_PREDICTION: '/api/yield-prediction', 
  IRRIGATION_OPTIMIZATION: '/api/irrigation-optimization',
};

// Error Types
const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  SERVER: 'SERVER_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

// Helper function to create fetch with timeout
const fetchWithTimeout = (url, options = {}, timeout = API_CONFIG.TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

// Helper function to build full URL
const buildUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to parse errors
const parseError = (error, response = null) => {
  // Timeout error
  if (error.message === 'Request timeout' || error.message.includes('timeout')) {
    return {
      type: ErrorTypes.TIMEOUT,
      message: 'The request took too long. Please try again with a smaller file or shorter message.',
      technicalError: error.message,
    };
  }

  // Network error
  if (error.message === 'Failed to fetch' || error.message.includes('Network') || !response) {
    return {
      type: ErrorTypes.NETWORK,
      message: 'Unable to connect to the AI service. Please check your internet connection and ensure you are on the same network as the server.',
      technicalError: error.message,
    };
  }

  // Server response errors
  if (response) {
    const { status } = response;

    switch (status) {
      case 400:
        return {
          type: ErrorTypes.VALIDATION,
          message: 'Invalid request. Please check your input and try again.',
          technicalError: 'Bad Request',
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
          message: 'The AI service is temporarily unavailable. Please try again in a moment.',
          technicalError: 'Server Error',
          statusCode: status,
        };

      default:
        return {
          type: ErrorTypes.SERVER,
          message: 'An unexpected error occurred. Please try again.',
          technicalError: `HTTP ${status}`,
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

// Helper function to validate message data
const validateMessageData = (messageData) => {
  if (!messageData) {
    throw new Error('Message data is required');
  }

  const { text, images, audioUri } = messageData;

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

// Helper function to create FormData for chat messages
const createChatFormData = (messageData, conversationId) => {
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

// API Service
const ApiService = {
  // Get current base URL
  getBaseUrl: () => API_CONFIG.BASE_URL,
  
  // Update base URL dynamically
  setBaseUrl: (newUrl) => {
    API_CONFIG.BASE_URL = newUrl;
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await fetchWithTimeout(
        buildUrl(ENDPOINTS.HEALTH_CHECK),
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        },
        5000
      );
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Test connection (same as health check but returns boolean)
  testConnection: async () => {
    try {
      const response = await fetchWithTimeout(
        buildUrl(ENDPOINTS.HEALTH_CHECK),
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        },
        5000
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // Chatbot - Send message with optional audio/image
  sendChatMessage: async (messageData, conversationId) => {
    try {
      // Validate message data
      validateMessageData(messageData);

      // Create form data
      const formData = createChatFormData(messageData, conversationId);

      const response = await fetchWithTimeout(
        buildUrl(ENDPOINTS.CHATBOT),
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        const parsedError = parseError(new Error(data.error || 'Request failed'), response);
        return {
          success: false,
          error: parsedError.type,
          message: data.response || parsedError.message,
          technicalError: data.error || parsedError.technicalError,
          statusCode: response.status,
          data: null,
        };
      }

      // Handle backend error status
      if (data.status === 'error') {
        return {
          success: false,
          error: data.error || 'unknown_error',
          message: data.response || 'An error occurred while processing your request.',
          data: data,
        };
      }

      // Success response
      return {
        success: true,
        data: {
          response: data.response,
          conversation_id: data.conversation_id,
          conversation_title: data.conversation_title,
          processing_time: data.processing_time,
          grounding_metadata: data.grounding_metadata,
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
  },

  // Chatbot - Clear session
  clearChatSession: async (conversationId) => {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      const response = await fetchWithTimeout(
        buildUrl(ENDPOINTS.CLEAR_SESSION),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ conversation_id: conversationId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clear session');
      }

      return {
        success: data.status === 'success',
        message: data.message,
      };

    } catch (error) {
      const parsedError = parseError(error);
      return {
        success: false,
        error: parsedError.type,
        message: parsedError.message,
      };
    }
  },

  // Disease Detection - Analyze plant image
  detectDisease: async (imageUri, iotData = null) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'plant_image.jpg',
      });
      
      if (iotData) {
        formData.append('iot_data', JSON.stringify(iotData));
      }
      
      formData.append('analysis_type', 'disease');
      
      const response = await fetchWithTimeout(
        buildUrl(ENDPOINTS.DISEASE_DETECTION),
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Disease detection failed');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Soil Health Assessment - Analyze based on IoT data and farm info
  assessSoilHealth: async (iotData, farmData) => {
    try {
      const response = await fetchWithTimeout(
        buildUrl(ENDPOINTS.SOIL_ASSESSMENT),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            iot_data: iotData,
            farm_data: farmData,
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Soil assessment failed');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Yield Prediction - Analyze crop for yield
  predictYield: async (iotData, farmData, cropData) => {
    try {
      const response = await fetchWithTimeout(
        buildUrl(ENDPOINTS.YIELD_PREDICTION),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            iot_data: iotData,
            farm_data: farmData,
            crop_data: cropData,
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Yield prediction failed');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Irrigation and Fertilizer Optimization
  optimizeIrrigation: async (iotData, farmData, cropData) => {
    try {
      const response = await fetchWithTimeout(
        buildUrl(ENDPOINTS.IRRIGATION_OPTIMIZATION),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            iot_data: iotData,
            farm_data: farmData,
            crop_data: cropData,
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Irrigation optimization failed');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default ApiService;
export { API_CONFIG, ENDPOINTS, ErrorTypes };