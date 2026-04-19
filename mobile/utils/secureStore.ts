import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'homefix_access_token';
const REFRESH_TOKEN_KEY = 'homefix_refresh_token';

/**
 * ============================
 * Secure Auth Storage
 * ============================
 * Wrapper around expo-secure-store for storing JWT tokens.
 * SecureStore encrypts the data using Android Keystore / iOS Keychain.
 */
export const authStorage = {
  /**
   * Save access and refresh tokens
   */
  setTokens: async (accessToken: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('SecureStore: Failed to save tokens', error);
      throw error;
    }
  },

  /**
   * Get access token
   */
  getAccessToken: async () => {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('SecureStore: Failed to get access token', error);
      return null;
    }
  },

  /**
   * Get refresh token
   */
  getRefreshToken: async () => {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('SecureStore: Failed to get refresh token', error);
      return null;
    }
  },

  /**
   * Clear all tokens (Logout)
   */
  clearTokens: async () => {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('SecureStore: Failed to clear tokens', error);
    }
  },
};
