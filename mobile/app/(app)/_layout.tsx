import { Stack } from 'expo-router';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function AppLayout() {
  usePushNotifications();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="category/[id]" />
      <Stack.Screen name="provider/[id]" />
      <Stack.Screen name="booking/create" />
      <Stack.Screen name="booking/job/[id]" />
      <Stack.Screen name="booking/job/review/[id]" />
      <Stack.Screen name="providers" />
      <Stack.Screen name="payment/[jobId]" />
      <Stack.Screen name="payment/receipt" />
      <Stack.Screen name="admin/payments" />
      <Stack.Screen name="admin/withdrawals" />
      <Stack.Screen name="admin/provider/[id]" />
    </Stack>
  );
}
