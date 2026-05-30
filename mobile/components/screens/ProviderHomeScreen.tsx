import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Briefcase, Star, Wallet, ToggleLeft, ChevronRight } from 'lucide-react-native';
import { JobStatus } from '@homefix/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { providerService } from '@/services/provider.service';
import { jobService, Job } from '@/services/job.service';
import { categoryService } from '@/services/category.service';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text variant="h4" weight="bold" style={styles.statValue}>{value}</Text>
      <Text variant="caption" color="muted">{label}</Text>
    </Card>
  );
}

export default function ProviderHomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['provider', 'me'],
    queryFn: () => providerService.getMyProfile(),
  });

  const { data: assignedJobs = [] } = useQuery({
    queryKey: ['providerAssignedJobs'],
    queryFn: jobService.getMyAssignedJobs,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.listActive,
  });

  const categoryMap = React.useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const [available, setAvailable] = useState<boolean | null>(null);
  const isAvailable = available ?? profile?.is_available ?? false;

  const { mutate: toggleAvailability, isPending } = useMutation({
    mutationFn: (val: boolean) =>
      providerService.updateMyAvailability(val),
    onSuccess: (_, val) => {
      setAvailable(val);
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] });
    },
    onError: () => {
      toast.error(t('provider_home.toggle_error'));
    },
  });

  const rating = parseFloat(profile?.rating_avg ?? '0').toFixed(1);
  const earnings = profile?.hourly_rate
    ? `৳${parseFloat(String(profile.hourly_rate)).toFixed(0)}/${t('category.hr')}`
    : '—';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h3" weight="bold">
            {t('nav.greeting', { name: user?.fullName || t('nav.there') })}
          </Text>
          <Text variant="body" color="muted" style={styles.headerSub}>
            {t('provider_home.subtitle')}
          </Text>
        </View>

        {/* Availability toggle */}
        <Card style={styles.availabilityCard}>
          <View style={styles.availabilityRow}>
            <View style={styles.availabilityLeft}>
              <ToggleLeft
                color={isAvailable ? theme.colors.success : theme.colors.textMuted}
                size={22}
              />
              <View style={styles.availabilityText}>
                <Text variant="body" weight="semibold">
                  {t('provider_home.availability')}
                </Text>
                <Text variant="caption" color="muted">
                  {isAvailable ? t('provider_home.you_are_visible') : t('provider_home.you_are_hidden')}
                </Text>
              </View>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={(val) => toggleAvailability(val)}
              disabled={isPending || isLoading}
              trackColor={{ false: theme.colors.border, true: theme.colors.success }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </Card>

        {/* Stats */}
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Briefcase color={theme.colors.primary} size={24} />}
              label={t('provider_home.active_jobs')}
              value={String(assignedJobs.length)}
            />
            <StatCard
              icon={<Star color={theme.colors.secondary} size={24} fill={theme.colors.secondary} />}
              label={t('provider_home.rating')}
              value={rating}
            />
            <StatCard
              icon={<Wallet color={theme.colors.success} size={24} />}
              label={t('provider_home.my_rate')}
              value={earnings}
            />
          </View>
        )}

        {/* Active jobs */}
        <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
          {t('provider_home.active_jobs_section')}
        </Text>

        {assignedJobs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text variant="body" color="muted" align="center">
              {t('my_jobs.empty')}
            </Text>
          </Card>
        ) : (
          assignedJobs.map((job) => {
            const isAwaiting = job.status === JobStatus.AWAITING_PAYMENT;
            return (
              <TouchableOpacity
                key={job.id}
                onPress={() => router.push(`/(app)/booking/job/${job.id}` as never)}
                activeOpacity={0.75}
              >
                <Card style={styles.activeJobCard}>
                  <View style={styles.activeJobRow}>
                    <View style={styles.activeJobInfo}>
                      <Text variant="body" weight="semibold" numberOfLines={1}>
                        {job.title ?? categoryMap.get(job.category_id) ?? t('home.unknown_provider')}
                      </Text>
                      <Text variant="caption" color="muted" numberOfLines={1}>
                        {[job.service_address?.road, job.service_address?.area].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                    <View style={[styles.badge, isAwaiting && styles.badgeAwaiting]}>
                      <Text
                        variant="caption"
                        weight="semibold"
                        style={{ color: isAwaiting ? theme.colors.primaryDark : theme.colors.success }}
                      >
                        {isAwaiting ? t('my_jobs.status_awaiting') : t('my_jobs.status_active')}
                      </Text>
                    </View>
                    <ChevronRight color={theme.colors.textMuted} size={16} />
                  </View>
                  {!isAwaiting && (
                    <Text variant="caption" color="muted" style={styles.hintText}>
                      {t('my_jobs.tap_to_complete')}
                    </Text>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        {/* Earnings placeholder */}
        <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
          {t('provider_home.earnings_section')}
        </Text>
        <Card style={styles.placeholderCard}>
          <Text variant="body" color="muted" align="center">
            {t('provider_home.earnings_coming')}
          </Text>
          <Text variant="caption" color="muted" align="center" style={styles.ticketRef}>
            HF-060
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl },
  header: { marginTop: theme.spacing.md, marginBottom: theme.spacing.md },
  headerSub: { marginTop: theme.spacing.xs },
  availabilityCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  availabilityText: { gap: 2 },
  loader: { marginVertical: theme.spacing.xl },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 4,
  },
  statIcon: { marginBottom: 4 },
  statValue: { textAlign: 'center' },
  sectionTitle: { marginBottom: theme.spacing.sm, marginTop: theme.spacing.xs },
  // Earnings placeholder (Sprint 6)
  placeholderCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  ticketRef: { marginTop: theme.spacing.xs },
  // Empty active jobs
  emptyCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  // Active job cards
  activeJobCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  activeJobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  activeJobInfo: { flex: 1, gap: 2 },
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
  hintText: { fontStyle: 'italic' },
});
