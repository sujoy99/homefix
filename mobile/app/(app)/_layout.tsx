import { Stack } from 'expo-router';

/**
 * ============================
 * App Route Group Layout
 * ============================
 * Only accessible to authenticated users.
 */
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'HomeFix',
          headerLargeTitle: true,
        }} 
      />
    </Stack>
  );
}
