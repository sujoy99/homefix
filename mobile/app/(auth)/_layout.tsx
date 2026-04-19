import { Stack } from 'expo-router';

/**
 * ============================
 * Auth Route Group Layout
 * ============================
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
