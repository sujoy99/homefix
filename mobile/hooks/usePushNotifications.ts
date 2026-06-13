import { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { notificationService } from '@/services/notification.service';
import { useNotificationStore } from '@/store/notificationStore';

type NotificationData = {
  type?: string;
  jobId?: string;
  callUrl?: string;
};

type NotificationSubscription = ReturnType<
  typeof Notifications.addNotificationResponseReceivedListener
>;

export function usePushNotifications() {
  const router = useRouter();
  const { t } = useTranslation();
  const { fetchNotifications } = useNotificationStore();
  const responseListenerRef = useRef<NotificationSubscription | null>(null);
  const foregroundListenerRef = useRef<NotificationSubscription | null>(null);

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
        const platform = Platform.OS as 'android' | 'ios' | 'web';
        if (!cancelled) {
          notificationService.registerDeviceToken(token, platform).catch(() => {});
        }
      } catch {
        // getDevicePushTokenAsync fails on simulators — silently skip
      }
    }

    register();

    // Foreground: refresh store + show call alert when app is open
    foregroundListenerRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as NotificationData;
        fetchNotifications(true);
        if (data?.type === 'CALL_STARTED' && data?.callUrl) {
          const callUrl = data.callUrl;
          Alert.alert(
            t('call.incoming_title'),
            t('call.incoming_body'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('call.join'), onPress: () => { void WebBrowser.openBrowserAsync(callUrl); } },
            ],
          );
        }
      },
    ) as unknown as NotificationSubscription;

    // Background/killed: route on notification tap
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        if (data?.type === 'CALL_STARTED' && data?.callUrl) {
          void WebBrowser.openBrowserAsync(data.callUrl);
        } else if (data?.type === 'NEW_MESSAGE' && data?.jobId) {
          router.push(`/(app)/booking/job/chat/${data.jobId}`);
        } else if (data?.jobId) {
          router.push(`/(app)/booking/job/${data.jobId}`);
        }
      },
    );

    return () => {
      cancelled = true;
      (foregroundListenerRef.current as unknown as { remove: () => void } | null)?.remove();
      responseListenerRef.current?.remove();
    };
  }, []);
}
