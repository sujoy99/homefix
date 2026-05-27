import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from '@/utils/secureStore';
import { UserRole } from '@homefix/shared';
import { apiClient } from '@/api/client';
import { authService } from '@/services/auth.service';
import { decodeJwtPayload } from '@/utils/jwtDecode';

const ONBOARDING_KEY = 'homefix_has_seen_onboarding';

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

  hydrate: async () => {
    try {
      const [token, onboardingFlag] = await Promise.all([
        authStorage.getAccessToken(),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);

      const hasSeenOnboarding = onboardingFlag === 'true';

      if (token) {
        const payload = decodeJwtPayload(token);
        const user = payload
          ? {
              id: payload.sub,
              role: payload.role,
              fullName: '',
              mobile: payload.mobile,
              email: payload.email ?? undefined,
            }
          : null;

        set({ isAuthenticated: true, user, hasSeenOnboarding: true, isLoading: false });
      } else {
        set({ isAuthenticated: false, hasSeenOnboarding, isLoading: false });
      }
    } catch (e) {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ hasSeenOnboarding: true });
  },

  login: async (data) => {
    set({ isLoading: true });
    try {
      const { user, tokens } = await authService.login(data);
      await useAuthStore.getState().setSession(
        { id: user.id, role: user.role as UserRole, fullName: user.full_name, mobile: user.mobile, email: user.email ?? undefined },
        tokens.accessToken,
        tokens.refreshToken
      );
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },
}));
