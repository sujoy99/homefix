import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import '@/i18n';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

/**
 * ============================
 * Root Layout (App Entry)
 * ============================
 * Protects routes based on authentication state.
 */
export default function RootLayout() {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
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

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated, redirect away from login/register
      router.replace('/(app)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Render the current route
  return <Slot />;
}
