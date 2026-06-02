import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/notification.service';

type NotificationData = {
  type?: string;
  jobId?: string;
};

type NotificationSubscription = ReturnType<
  typeof Notifications.addNotificationResponseReceivedListener
>;

export function usePushNotifications() {
  const router = useRouter();
  const responseListenerRef = useRef<NotificationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function register() {
      if (!Device.isDevice) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted' || cancelled) return;

      try {
        const { data: token } = await Notifications.getDevicePushTokenAsync();
        if (!cancelled) {
          notificationService.registerDeviceToken(token).catch(() => {});
        }
      } catch {
        // getDevicePushTokenAsync fails on simulators — silently skip
      }
    }

    register();

    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        if (data?.jobId) {
          router.push(`/(app)/booking/job/${data.jobId}`);
        }
      },
    );

    return () => {
      cancelled = true;
      responseListenerRef.current?.remove();
    };
  }, []);
}
