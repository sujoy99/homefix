import { Stack } from 'expo-router';

/**
 * (app) Stack layout.
 *
 * (tabs)          → bottom tab navigator (Home / Bookings|Jobs / Profile)
 * category/[id]   → category provider listing  (slides over tabs, no tab bar)
 * provider/[id]   → provider detail + Book Now  (slides over tabs, no tab bar)
 *
 * Detail screens live here so they are never auto-discovered by the Tabs
 * navigator — that was causing category/[id] and provider/[id] to appear
 * as ghost tabs in the tab bar.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="category/[id]" />
      <Stack.Screen name="provider/[id]" />
      <Stack.Screen name="booking/create" />
      <Stack.Screen name="booking/job/[id]" />
      <Stack.Screen name="providers" />
      <Stack.Screen name="payment/[jobId]" />
      <Stack.Screen name="payment/receipt" />
      <Stack.Screen name="admin/payments" />
      <Stack.Screen name="admin/withdrawals" />
      <Stack.Screen name="admin/provider/[id]" />
    </Stack>
  );
}
