import { create } from 'zustand';
import { authStorage } from '../utils/secureStore';
import { UserRole } from '@homefix/shared';

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
  
  // Actions
  setSession: (user: UserSession, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
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

  setSession: async (user, accessToken, refreshToken) => {
    // 1. Save to Secure Store
    await authStorage.setTokens(accessToken, refreshToken);
    // 2. Update memory state
    set({ isAuthenticated: true, user, isLoading: false });
  },

  logout: async () => {
    // 1. Remove from Secure Store
    await authStorage.clearTokens();
    // 2. Clear memory state
    set({ isAuthenticated: false, user: null, isLoading: false });
  },

  /**
   * Called when the app starts.
   * Checks SecureStore for a token to determine if user is logged in.
   * (In reality, we should also validate the token with the server or check its expiry).
   */
  hydrate: async () => {
    try {
      const token = await authStorage.getAccessToken();
      if (token) {
        // We have a token. We don't have the user object yet unless we stored it locally
        // or fetched /api/me. For now, just mark authenticated.
        set({ isAuthenticated: true, isLoading: false });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));
