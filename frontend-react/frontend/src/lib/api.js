import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const checkHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Get accessibility data
export const getAccessibilityData = async () => {
  try {
    const response = await api.get('/api/accessibility');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch accessibility data:', error);
    throw error;
  }
};

// Get ML predictions
export const getPredictions = async () => {
  try {
    const response = await api.get('/api/predictions');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch predictions:', error);
    throw error;
  }
};

// Analyze specific region
export const analyzeRegion = async (regionName) => {
  try {
    const response = await api.post('/api/analyze-region', {
      region: regionName,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to analyze region:', error);
    throw error;
  }
};

// Get recommendations
export const getRecommendations = async (district = 'all') => {
  try {
    const response = await api.get('/api/recommendations', {
      params: { district },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    throw error;
  }
};

// Upload satellite imagery
export const uploadSatelliteImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload-satellite', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upload satellite image:', error);
    throw error;
  }
};

export default api;