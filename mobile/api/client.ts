import axios from 'axios';
import { authStorage } from '../utils/secureStore';
import { useAuthStore } from '../store/authStore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Extract the computer's dynamic local IP address from Expo constants
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || 'localhost';

// Use localhost for web, and your computer's dynamic local IP for Expo Go
const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:4000/api'
  : `http://${localhost}:4000/api`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request interceptor to add access token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await authStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Call refresh endpoint
        const response = await axios.post(`${BASE_URL}/v2/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.body;

        // Save new tokens
        await authStorage.setTokens(accessToken, newRefreshToken);

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        console.error('Session expired, logging out...');
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
