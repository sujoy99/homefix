import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Screen scrollable>
      <View style={{ marginBottom: 24 }}>
        <Text variant="h2" weight="bold">
          Hi, {user?.fullName || 'Resident'} 👋
        </Text>
        <Text variant="body" color="muted">
          What do you need help with today?
        </Text>
      </View>

      <Card elevated style={{ marginBottom: 24 }}>
        <Text variant="h4" weight="semibold" style={{ marginBottom: 8 }}>
          Current Booking
        </Text>
        <Text variant="body" color="muted">
          No active bookings found.
        </Text>
      </Card>

      <Button 
        variant="outline"
        label="Log Out" 
        onPress={() => logout()}
      />
    </Screen>
  );
}
