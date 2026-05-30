import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  SectionList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { MapPin, Briefcase } from 'lucide-react-native';
import { JobStatus } from '@homefix/shared';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
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

// ── Compact active-job card shown in "My Active Jobs" section ─────────────────
function ActiveJobCard({
  job,
  categoryName,
  onPress,
}: {
  job: Job;
  categoryName?: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const isAwaiting = job.status === JobStatus.AWAITING_PAYMENT;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Card style={activeStyles.card}>
        <View style={activeStyles.row}>
          <View style={activeStyles.info}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {job.title ?? categoryName ?? t('home.unknown_provider')}
            </Text>
            {categoryName && (
              <Text variant="caption" color="primary">{categoryName}</Text>
            )}
            <Text variant="caption" color="muted" numberOfLines={1}>
              {[job.service_address?.road, job.service_address?.area]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
          <View style={[activeStyles.badge, isAwaiting && activeStyles.badgeAwaiting]}>
            <Text
              variant="caption"
              weight="semibold"
              style={{ color: isAwaiting ? theme.colors.primaryDark : theme.colors.success }}
            >
              {isAwaiting ? t('my_jobs.status_awaiting') : t('my_jobs.status_active')}
            </Text>
          </View>
        </View>
        {!isAwaiting && (
          <Text variant="caption" color="muted" style={activeStyles.hint}>
            {t('my_jobs.tap_to_complete')}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const activeStyles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  info: { flex: 1, gap: 2 },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.successBackground,
    flexShrink: 0,
  },
  badgeAwaiting: {
    backgroundColor: theme.colors.raw.primaryLight + '33',
  },
  hint: { fontStyle: 'italic' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function JobsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [coords, setCoords] = useState<DeviceCoords>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const locationFetched = useRef(false);

  useEffect(() => {
    if (locationFetched.current) return;
    locationFetched.current = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationDenied(true); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    })();
  }, []);

  // ── Active/awaiting jobs (provider owns) ──────────────────────────────────
  const {
    data: assignedJobs = [],
    isRefetching: refetchingAssigned,
    refetch: refetchAssigned,
  } = useQuery({
    queryKey: ['providerAssignedJobs'],
    queryFn: jobService.getMyAssignedJobs,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  // ── Available feed ─────────────────────────────────────────────────────────
  const {
    data: feedJobs = [],
    isLoading: loadingFeed,
    isError: feedError,
    refetch: refetchFeed,
    isRefetching: refetchingFeed,
  } = useQuery({
    queryKey: ['providerFeed', coords?.lat, coords?.lon],
    queryFn: () => jobService.getProviderFeed({ lat: coords?.lat, lon: coords?.lon, limit: 20 }),
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

  const feedWithDistance = React.useMemo(() => {
    if (!coords) return feedJobs.map((j) => ({ job: j, distanceKm: null as number | null }));
    return feedJobs.map((j) => ({
      job: j,
      distanceKm:
        j.service_lat !== null && j.service_lon !== null
          ? haversineKm(coords.lat, coords.lon, j.service_lat, j.service_lon)
          : null,
    }));
  }, [feedJobs, coords]);

  const handleRefresh = async () => {
    await Promise.all([refetchAssigned(), refetchFeed()]);
  };

  const navigateToJob = (job: Job) =>
    router.push(`/(app)/booking/job/${job.id}` as never);

  const isRefreshing = refetchingAssigned || refetchingFeed;

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
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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

      <FlatList
        data={feedWithDistance}
        keyExtractor={({ job }) => job.id}
        contentContainerStyle={[
          styles.listContent,
          feedWithDistance.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || loadingFeed}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        // ── "My Active Jobs" section pinned above feed ───────────────────────
        ListHeaderComponent={
          <View>
            {/* My Active Jobs */}
            <View style={styles.sectionHeader}>
              <Briefcase color={theme.colors.primary} size={16} />
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                {t('my_jobs.section_title')}
              </Text>
              {assignedJobs.length > 0 && (
                <View style={styles.countBadge}>
                  <Text variant="caption" weight="bold" color="primary">{assignedJobs.length}</Text>
                </View>
              )}
            </View>

            {assignedJobs.length === 0 ? (
              <Text variant="caption" color="muted" style={styles.emptyAssigned}>
                {t('my_jobs.empty')}
              </Text>
            ) : (
              assignedJobs.map((job) => (
                <ActiveJobCard
                  key={job.id}
                  job={job}
                  categoryName={categoryMap.get(job.category_id)}
                  onPress={() => navigateToJob(job)}
                />
              ))
            )}

            {/* Feed section heading */}
            <View style={[styles.sectionHeader, styles.feedSectionHeader]}>
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                {t('feed.subtitle')}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loadingFeed ? null : (
            <View style={styles.emptyWrap}>
              <MapPin color={theme.colors.primary} size={48} />
              <Text variant="h4" weight="semibold" align="center" style={styles.emptyTitle}>
                {feedError ? t('feed.load_error') : t('feed.empty_title')}
              </Text>
              {!feedError && (
                <Text variant="body" color="muted" align="center">{t('feed.empty_desc')}</Text>
              )}
            </View>
          )
        }
        renderItem={({ item: { job, distanceKm } }) => (
          <ProviderJobCard
            job={job}
            categoryName={categoryMap.get(job.category_id)}
            distanceKm={distanceKm}
            onPress={() => navigateToJob(job)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
  locationText: { color: theme.colors.warning, flex: 1 },
  listContent: { padding: theme.spacing.md, paddingBottom: 32 },
  listContentEmpty: { flexGrow: 1 },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  feedSectionHeader: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionTitle: { flex: 1 },
  countBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.layout.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  emptyAssigned: {
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
    paddingLeft: theme.spacing.xs,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyTitle: { marginTop: theme.spacing.sm },
});
