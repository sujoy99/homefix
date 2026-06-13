import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import '@/i18n';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { theme } from '../theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toast } from '@/components/ui/Toast';

// ── Dev-mode error suppression ────────────────────────────────────────────────
// Suppress known, non-actionable errors from showing as red overlays or yellow
// banners in the Expo Go development client. These are either:
//   • Expo Go SDK limitations (push, expo-av) — require a dev build
//   • Pre-existing intentional patterns (circular import, Linking scheme)
//   • Handled API errors that TanStack Query / try-catch already manages

if (__DEV__) {
  // 1. Intercept console.error to suppress patterns that would trigger the
  //    full-screen red overlay in React Native dev mode.
  const _origError = console.error.bind(console);
  const SUPPRESS_ERROR = [
    'expo-notifications',           // push not supported in Expo Go
    'expo-av',                       // deprecation warning
    'Require cycle',                 // authStore ↔ apiClient — intentional
    'Linking requires',              // scheme missing in app.json — dev only
    'AxiosError',                    // API errors handled by try-catch / TanStack Query
    'Network request failed',        // no backend running — handled in UI
    'Request failed with status',   // 4xx/5xx — handled by response interceptor
    'Non-serializable values',      // RN navigation param warning
  ];
  console.error = (...args: unknown[]) => {
    const msg = String(args[0] ?? '');
    if (SUPPRESS_ERROR.some((p) => msg.includes(p))) return;
    _origError(...args);
  };

  // 2. Suppress LogBox yellow banners for the same patterns.
  LogBox.ignoreLogs([
    'expo-notifications',
    '[expo-av]',
    'Require cycle: store/authStore',
    'Linking requires a build-time setting',
    'Non-serializable values were found',
  ]);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

export default function RootLayout() {
  const { isAuthenticated, isLoading, hydrate, hasSeenOnboarding } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Hydrate the session on mount
  useEffect(() => {
    hydrate();
  }, []);

  // 2. Auth routing logic
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments.includes('onboarding');

    if (!hasSeenOnboarding && !isOnboarding) {
      // User hasn't seen onboarding, redirect to onboarding
      router.replace('/(auth)/onboarding');
    } else if (hasSeenOnboarding && !isAuthenticated && !inAuthGroup) {
      // User has seen onboarding but is not authenticated, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated, redirect away from login/register
      router.replace('/(app)');
    }
  }, [isAuthenticated, isLoading, segments, hasSeenOnboarding]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Render the current route
  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }}>
        <Slot />
        <Toast />
      </View>
    </QueryClientProvider>
  );
}
