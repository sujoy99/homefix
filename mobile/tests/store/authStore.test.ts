import { act } from '@testing-library/react-native';
import { useAuthStore } from '../../store/authStore';
import { buildUserSession, buildTokenPair } from '../factories/user.factory';

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      hasSeenOnboarding: false,
    });
  });

  it('setSession stores user and marks authenticated', async () => {
    const user = buildUserSession();
    const { accessToken, refreshToken } = buildTokenPair();

    await act(async () => {
      await useAuthStore.getState().setSession(user, accessToken, refreshToken);
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toMatchObject({ id: user.id, role: user.role });
  });

  it('logout clears session', async () => {
    const user = buildUserSession();
    const { accessToken, refreshToken } = buildTokenPair();

    await act(async () => {
      await useAuthStore.getState().setSession(user, accessToken, refreshToken);
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('hydrate restores session when token exists', async () => {
    const secureStore = await import('expo-secure-store');
    (secureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('mock-access-token');

    await act(async () => {
      await useAuthStore.getState().hydrate();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
