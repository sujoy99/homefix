import { create } from 'zustand';
import { authStorage } from '../utils/secureStore';
import { UserRole } from '@homefix/shared';
import { apiClient } from '../api/client';

export interface UserSession {
  id: string;
  role: UserRole;
  fullName: string;
  mobile?: string;
  email?: string;
  photoUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserSession | null;
  isLoading: boolean;
  
  hasSeenOnboarding: boolean;
  
  // Actions
  setSession: (user: UserSession, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  login: (data: any) => Promise<void>;
}

/**
 * ============================
 * Auth Zustand Store
 * ============================
 * Manages the global authentication state.
 */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true, // true by default until hydrate() finishes
  hasSeenOnboarding: false,

  setSession: async (user, accessToken, refreshToken) => {
    // 1. Save to Secure Store
    await authStorage.setTokens(accessToken, refreshToken);
    // 2. Update memory state
    set({ isAuthenticated: true, user, hasSeenOnboarding: true, isLoading: false });
  },

  logout: async () => {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/v2/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.error('Logout API failed', e);
    } finally {
      // Always clear local state
      await authStorage.clearTokens();
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  /**
   * Called when the app starts.
   * Checks SecureStore for a token to determine if user is logged in.
   * (In reality, we should also validate the token with the server or check its expiry).
   */
  hydrate: async () => {
    try {
      const token = await authStorage.getAccessToken();
      // Also check if onboarding was seen (mocking for now, could use AsyncStorage)
      // For now, let's just assume if they have a token, they've seen onboarding
      if (token) {
        set({ isAuthenticated: true, hasSeenOnboarding: true, isLoading: false });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  completeOnboarding: async () => {
    set({ hasSeenOnboarding: true });
  },

  login: async (data) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/v2/auth/login', data);
      const { user, tokens } = response.data.body;
      await useAuthStore.getState().setSession(user, tokens.accessToken, tokens.refreshToken);
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },
}));
