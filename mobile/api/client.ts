import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { ErrorCode, FORCE_LOGOUT_CODES, TOKEN_REFRESH_CODES } from '@homefix/shared';
import { authStorage } from '../utils/secureStore';
import { useAuthStore } from '../store/authStore';

/**
 * ============================
 * API Configuration
 * ============================
 */

// In development, map to your local machine IP so Android emulator / Expo Go works
// In production, use your actual API URL
const DEV_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const PROD_API_URL = 'https://api.homefix.com';

const BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Injects the Access Token into every outgoing request if available
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Handles automatic token refresh when 401 Unauthorized occurs
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error_code?: ErrorCode; message: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const data = error.response?.data;
    const errorCode = data?.error_code as ErrorCode;

    // Handle session expired / hard logout cases
    if (errorCode && FORCE_LOGOUT_CODES.has(errorCode)) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Handle token expiration (trigger refresh)
    if (
      error.response?.status === 401 &&
      errorCode &&
      TOKEN_REFRESH_CODES.has(errorCode) &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await authStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint directly using a new axios instance to avoid infinite loops
        const refreshResponse = await axios.post(`${BASE_URL}/api/v2/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccess, refreshToken: newRefresh } = refreshResponse.data.body;

        // Save new tokens
        await authStorage.setTokens(newAccess, newRefresh);

        // Update original request with new token and retry
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        }
        return api(originalRequest);
        
      } catch (refreshError) {
        // If refresh fails, log the user out
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
