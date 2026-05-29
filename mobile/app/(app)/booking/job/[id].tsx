import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Square,
  Calendar,
  Layers,
  AlertCircle,
} from 'lucide-react-native';
import { JobStatus } from '@homefix/shared';
import { UserRole } from '@homefix/shared';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { jobService } from '@/services/job.service';
import { categoryService } from '@/services/category.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

export default function JobDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userRole = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id);

  const [isAccepting, setIsAccepting] = useState(false);

  const {
    data: job,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJobById(id),
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.listActive,
  });

  const categoryName = categories.find((c) => c.id === job?.category_id)?.name;

  // ── Provider: accept the job ───────────────────────────────────────────────
  const handleAccept = async () => {
    if (!job) return;
    setIsAccepting(true);
    try {
      await jobService.acceptJob(job.id);
      toast.success(t('job_detail.accept_success'));
      // Invalidate both the feed (job disappears) and my jobs list
      queryClient.invalidateQueries({ queryKey: ['providerFeed'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      router.back();
    } catch (err) {
      const errorCode = (err as { response?: { data?: { error_code?: string } } })
        ?.response?.data?.error_code;
      if (errorCode === 'INVALID_STATE_TRANSITION') {
        // Another provider accepted concurrently — backend state machine prevented the race
        toast.error(t('job_detail.accept_concurrent'));
        queryClient.invalidateQueries({ queryKey: ['providerFeed'] });
        router.back();
      } else {
        toast.error(t('job_detail.accept_error'));
      }
    } finally {
      setIsAccepting(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onBack={() => router.back()} title={t('job_detail.title')} />
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (isError || !job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onBack={() => router.back()} title={t('job_detail.title')} />
        <View style={styles.errorWrap}>
          <Text variant="body" color="muted" align="center">{t('job_detail.load_error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isProvider = userRole === UserRole.PROVIDER;
  const isPending = job.status === JobStatus.PENDING;
  const jobTakenByOther = isProvider && !isPending && job.provider_id !== userId;

  const title = job.title ?? categoryName ?? t('home.unknown_provider');
  const addressParts = [
    job.service_address?.house,
    job.service_address?.flat,
    job.service_address?.road,
    job.service_address?.area,
  ].filter(Boolean);

  const budget = job.estimated_budget
    ? `৳${parseFloat(String(job.estimated_budget)).toFixed(0)}`
    : t('job_detail.budget_tbd');

  const postedDate = new Date(job.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onBack={() => router.back()} title={t('job_detail.title')} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Already-taken notice (provider view, non-pending) */}
        {jobTakenByOther && (
          <Card style={styles.takenBanner}>
            <View style={styles.takenRow}>
              <AlertCircle color={theme.colors.warning} size={18} />
              <View style={styles.takenText}>
                <Text variant="body" weight="semibold">{t('job_detail.already_accepted')}</Text>
                <Text variant="caption" color="muted">{t('job_detail.already_accepted_desc')}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Title + category */}
        <Card style={styles.section}>
          <Text variant="h4" weight="bold" style={styles.jobTitle}>{title}</Text>
          {categoryName && (
            <View style={styles.categoryChip}>
              <Layers color={theme.colors.primary} size={13} />
              <Text variant="caption" weight="semibold" color="primary" style={styles.chipText}>
                {categoryName}
              </Text>
            </View>
          )}
          <View style={styles.postedRow}>
            <Calendar color={theme.colors.textMuted} size={13} />
            <Text variant="caption" color="muted" style={styles.postedText}>
              {t('job_detail.posted')} {postedDate}
            </Text>
          </View>
        </Card>

        {/* Description */}
        <Card style={styles.section}>
          <Text variant="body" weight="semibold" style={styles.sectionTitle}>
            {t('job_detail.description')}
          </Text>
          <Text variant="body" color="muted" style={styles.descText}>{job.description}</Text>
        </Card>

        {/* Service address */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color={theme.colors.primary} size={16} />
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              {t('job_detail.address')}
            </Text>
          </View>
          {addressParts.map((line, i) => (
            <Text key={i} variant="body" color="muted">{line}</Text>
          ))}
        </Card>

        {/* Budget + sq footage row */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, styles.flex]}>
            <DollarSign color={theme.colors.primary} size={16} />
            <Text variant="caption" color="muted" style={styles.statLabel}>
              {t('job_detail.budget')}
            </Text>
            <Text variant="body" weight="semibold">{budget}</Text>
          </Card>

          {job.square_footage && (
            <Card style={[styles.statCard, styles.flex]}>
              <Square color={theme.colors.primary} size={16} />
              <Text variant="caption" color="muted" style={styles.statLabel}>
                {t('job_detail.area')}
              </Text>
              <Text variant="body" weight="semibold">
                {parseFloat(String(job.square_footage)).toFixed(0)} {t('job_detail.sq_ft')}
              </Text>
            </Card>
          )}
        </View>

        {/* Photos */}
        {job.media_urls?.length > 0 && (
          <Card style={styles.section}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              {t('job_detail.photos')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {job.media_urls.map((url, i) => (
                <Image
                  key={i}
                  source={{ uri: url }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </Card>
        )}
      </ScrollView>

      {/* Footer — provider only, job still pending */}
      {isProvider && isPending && (
        <View style={styles.footer}>
          <Button
            label={isAccepting ? t('job_detail.accepting') : t('job_detail.accept')}
            variant="secondary"
            disabled={isAccepting}
            onPress={handleAccept}
          />
          <Button
            label={t('job_detail.not_interested')}
            variant="ghost"
            onPress={() => router.back()}
            style={styles.skipBtn}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Header sub-component ─────────────────────────────────────────────────────
function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
        <ArrowLeft color={theme.colors.text} size={22} />
      </TouchableOpacity>
      <Text variant="h4" weight="bold" style={styles.headerTitle}>{title}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loader: { marginTop: theme.spacing['2xl'] },
  errorWrap: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl },
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 120,
    gap: theme.spacing.sm,
  },
  // Already-taken banner
  takenBanner: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  takenRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
  takenText: { flex: 1, gap: 2 },
  // Job header card
  section: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  jobTitle: { marginBottom: theme.spacing.xs },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.layout.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  chipText: { marginTop: 1 },
  postedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  postedText: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: { marginBottom: theme.spacing.xs },
  descText: { lineHeight: 22 },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  flex: { flex: 1 },
  statCard: {
    padding: theme.spacing.md,
    gap: 4,
    alignItems: 'flex-start',
  },
  statLabel: { marginTop: 4 },
  // Photos
  photoRow: { marginTop: theme.spacing.xs },
  photo: {
    width: 100,
    height: 100,
    borderRadius: theme.layout.radius.md,
    marginRight: theme.spacing.sm,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  skipBtn: {
    marginTop: 0,
  },
});
