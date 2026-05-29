import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { ProviderJobCard } from '@/components/shared/ProviderJobCard';
import { jobService, Job } from '@/services/job.service';
import { categoryService } from '@/services/category.service';
import { theme } from '@/theme';

type DeviceCoords = { lat: number; lon: number } | null;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function JobsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [coords, setCoords] = useState<DeviceCoords>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const locationFetched = useRef(false);

  // ── Get device location once on mount ──────────────────────────────────────
  useEffect(() => {
    if (locationFetched.current) return;
    locationFetched.current = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    })();
  }, []);

  // ── Fetch feed (re-fetches when coords arrive) ─────────────────────────────
  const {
    data: jobs = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['providerFeed', coords?.lat, coords?.lon],
    queryFn: () =>
      jobService.getProviderFeed({
        lat: coords?.lat,
        lon: coords?.lon,
        limit: 20,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.listActive,
  });

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // ── Client-side distance decoration ───────────────────────────────────────
  const jobsWithDistance = React.useMemo(() => {
    if (!coords) return jobs.map((j) => ({ job: j, distanceKm: null as number | null }));
    return jobs.map((j) => {
      const distanceKm =
        j.service_lat !== null && j.service_lon !== null
          ? haversineKm(coords.lat, coords.lon, j.service_lat, j.service_lon)
          : null;
      return { job: j, distanceKm };
    });
  }, [jobs, coords]);

  const handleJobPress = (job: Job) => {
    router.push(`/(app)/booking/job/${job.id}` as never);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <MapPin color={theme.colors.primary} size={48} />
      <Text variant="h4" weight="semibold" align="center" style={styles.emptyTitle}>
        {t('feed.empty_title')}
      </Text>
      <Text variant="body" color="muted" align="center" style={styles.emptyDesc}>
        {t('feed.empty_desc')}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyWrap}>
      <Text variant="body" color="muted" align="center">{t('feed.load_error')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="h2" weight="bold">{t('feed.title')}</Text>
          <Text variant="caption" color="muted">{t('feed.subtitle')}</Text>
        </View>
        {locationDenied && (
          <TouchableOpacity
            style={styles.locationBanner}
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                setLocationDenied(false);
                const pos = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Balanced,
                });
                setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                queryClient.invalidateQueries({ queryKey: ['providerFeed'] });
              }
            }}
            hitSlop={8}
          >
            <MapPin color={theme.colors.warning} size={14} />
            <Text variant="caption" style={styles.locationText}>
              {t('feed.location_denied')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Feed list */}
      {isError ? (
        renderError()
      ) : (
        <FlatList
          data={jobsWithDistance}
          keyExtractor={({ job }) => job.id}
          contentContainerStyle={[
            styles.listContent,
            jobsWithDistance.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isLoading}
              onRefresh={refetch}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={isLoading ? null : renderEmpty()}
          renderItem={({ item: { job, distanceKm } }) => (
            <ProviderJobCard
              job={job}
              categoryName={categoryMap.get(job.category_id)}
              distanceKm={distanceKm}
              onPress={() => handleJobPress(job)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  locationText: {
    color: theme.colors.warning,
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    marginTop: theme.spacing.sm,
  },
  emptyDesc: {
    textAlign: 'center',
  },
});
