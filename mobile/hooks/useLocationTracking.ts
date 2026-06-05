import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { locationService } from '@/services/location.service';

const MIN_INTERVAL_MS = 15_000;
const MIN_DISTANCE_M = 20;

/**
 * Provider-side foreground GPS tracking hook.
 * Watches position while enabled (ACTIVE job in progress) and pushes updates
 * to the backend every 15 s / 20 m — whichever fires first.
 * Stops automatically on unmount or when enabled toggles to false.
 */
export function useLocationTracking(enabled: boolean): void {
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    async function start() {
      const { status: existing } = await Location.getForegroundPermissionsAsync();
      let granted = existing === 'granted';

      if (!granted) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        granted = status === 'granted';
      }

      if (!granted || !active) return;

      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: MIN_INTERVAL_MS,
          distanceInterval: MIN_DISTANCE_M,
        },
        (loc) => {
          if (!active) return;
          const now = Date.now();
          if (now - lastSentAtRef.current < MIN_INTERVAL_MS) return;
          lastSentAtRef.current = now;
          const { latitude, longitude } = loc.coords;
          locationService.updateMyLocation(latitude, longitude).catch(() => {});
        },
      );
    }

    start();

    return () => {
      active = false;
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, [enabled]);
}
