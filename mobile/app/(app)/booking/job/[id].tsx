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
  CheckCircle2,
  Circle,
  User,
} from 'lucide-react-native';
import { JobStatus, UserRole } from '@homefix/shared';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { jobService } from '@/services/job.service';
import { categoryService } from '@/services/category.service';
import { providerService } from '@/services/provider.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

// ── Status step ordering ──────────────────────────────────────────────────────
const STATUS_ORDER: Record<string, number> = {
  [JobStatus.PENDING]: 0,
  [JobStatus.ACTIVE]: 1,
  [JobStatus.AWAITING_PAYMENT]: 2,
  [JobStatus.PAID]: 3,
};

type StepDef = {
  labelKey: string;
  descKey: string;
  reachedStatus: JobStatus;
};

const STEPS: StepDef[] = [
  { labelKey: 'tracking.step_posted',   descKey: 'tracking.step_posted_desc',   reachedStatus: JobStatus.PENDING },
  { labelKey: 'tracking.step_accepted', descKey: 'tracking.step_accepted_desc', reachedStatus: JobStatus.ACTIVE },
  { labelKey: 'tracking.step_complete', descKey: 'tracking.step_complete_desc', reachedStatus: JobStatus.AWAITING_PAYMENT },
  { labelKey: 'tracking.step_paid',     descKey: 'tracking.step_paid_desc',     reachedStatus: JobStatus.PAID },
];

export default function JobDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userRole = useAuthStore((s) => s.user?.role);
  const userId   = useAuthStore((s) => s.user?.id);

  const [isAccepting,   setIsAccepting]   = useState(false);
  const [isCompleting,  setIsCompleting]  = useState(false);

  // ── Job query — 10 s polling, pauses when app is backgrounded ─────────────
  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn:  () => jobService.getJobById(id),
    enabled:  !!id,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  categoryService.listActive,
  });

  // ── Provider profile — only when assigned and viewer is a resident ─────────
  const isResident = userRole === UserRole.RESIDENT;
  const isProvider = userRole === UserRole.PROVIDER;

  const { data: assignedProvider } = useQuery({
    queryKey: ['provider', job?.provider_id],
    queryFn:  () => providerService.getProfile(job!.provider_id!),
    enabled:  isResident && !!job?.provider_id,
  });

  const categoryName = categories.find((c) => c.id === job?.category_id)?.name;

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!job) return;
    setIsAccepting(true);
    try {
      await jobService.acceptJob(job.id);
      toast.success(t('job_detail.accept_success'));
      queryClient.invalidateQueries({ queryKey: ['providerFeed'] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      router.back();
    } catch (err) {
      const errorCode = (err as { response?: { data?: { error_code?: string } } })
        ?.response?.data?.error_code;
      if (errorCode === 'INVALID_STATE_TRANSITION') {
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

  const handleMarkComplete = async () => {
    if (!job) return;
    setIsCompleting(true);
    try {
      await jobService.completeJob(job.id);
      toast.success(t('tracking.complete_success'));
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    } catch (err) {
      const errorCode = (err as { response?: { data?: { error_code?: string } } })
        ?.response?.data?.error_code;
      if (errorCode === 'INVALID_STATE_TRANSITION') {
        toast.error(t('errors.INVALID_STATE_TRANSITION'));
        queryClient.invalidateQueries({ queryKey: ['job', id] });
      } else {
        toast.error(t('tracking.complete_error'));
      }
    } finally {
      setIsCompleting(false);
    }
  };

  // ── Loading / error ────────────────────────────────────────────────────────
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

  const isPending  = job.status === JobStatus.PENDING;
  const isActive   = job.status === JobStatus.ACTIVE;
  const isCancelled = job.status === JobStatus.CANCELLED;
  const isMyJob    = isProvider && job.provider_id === userId;
  const jobTakenByOther = isProvider && !isPending && !isMyJob;

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
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const providerName = assignedProvider?.user?.full_name ?? t('home.unknown_provider');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onBack={() => router.back()} title={t('job_detail.title')} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Already-taken banner (provider seeing someone else's active job) */}
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

        {/* ── Status stepper (resident always; provider on their own job) ── */}
        {(isResident || isMyJob) && !isCancelled && (
          <Card style={styles.section}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              {t('tracking.status_card')}
            </Text>
            <StatusStepper currentStatus={job.status} t={t} />
          </Card>
        )}

        {/* ── Assigned provider info (resident view, once accepted) ── */}
        {isResident && assignedProvider && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <User color={theme.colors.primary} size={16} />
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                {t('tracking.provider_section')}
              </Text>
            </View>
            <View style={styles.providerRow}>
              <View style={styles.providerAvatar}>
                <Text variant="h4" weight="bold" color="inverse">
                  {providerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.providerInfo}>
                <Text variant="body" weight="semibold">{providerName}</Text>
                {assignedProvider.rating_avg && (
                  <Text variant="caption" color="muted">
                    ★ {parseFloat(assignedProvider.rating_avg).toFixed(1)}
                    {'  '}·{'  '}
                    {assignedProvider.experience_years} yrs exp
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* ── Title + category ── */}
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

        {/* ── Description ── */}
        <Card style={styles.section}>
          <Text variant="body" weight="semibold" style={styles.sectionTitle}>
            {t('job_detail.description')}
          </Text>
          <Text variant="body" color="muted" style={styles.descText}>{job.description}</Text>
        </Card>

        {/* ── Service address ── */}
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

        {/* ── Budget + sq footage ── */}
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

        {/* ── Photos ── */}
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

      {/* ── Footer CTAs ── */}

      {/* Provider + PENDING → Accept / Not Interested */}
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
          />
        </View>
      )}

      {/* Provider + ACTIVE + own job → Mark Work Complete */}
      {isProvider && isActive && isMyJob && (
        <View style={styles.footer}>
          <Button
            label={isCompleting ? t('tracking.marking') : t('tracking.mark_complete')}
            variant="secondary"
            disabled={isCompleting}
            onPress={handleMarkComplete}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Status Stepper ───────────────────────────────────────────────────────────
function StatusStepper({
  currentStatus,
  t,
}: {
  currentStatus: JobStatus;
  t: (key: string) => string;
}) {
  const currentIndex = STATUS_ORDER[currentStatus] ?? 0;

  return (
    <View style={stepperStyles.wrap}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent   = index === currentIndex;
        const isUpcoming  = index > currentIndex;

        return (
          <View key={step.reachedStatus} style={stepperStyles.stepRow}>
            {/* Connector line above (all except first) */}
            {index > 0 && (
              <View
                style={[
                  stepperStyles.connector,
                  isCompleted || isCurrent ? stepperStyles.connectorDone : stepperStyles.connectorPending,
                ]}
              />
            )}

            {/* Icon + label row */}
            <View style={stepperStyles.iconLabelRow}>
              <View style={stepperStyles.iconWrap}>
                {isCompleted ? (
                  <CheckCircle2 color={theme.colors.success} size={22} fill={theme.colors.successBackground} />
                ) : isCurrent ? (
                  <View style={stepperStyles.currentDot}>
                    <View style={stepperStyles.currentInner} />
                  </View>
                ) : (
                  <Circle color={theme.colors.border} size={22} />
                )}
              </View>

              <View style={stepperStyles.labelWrap}>
                <Text
                  variant="body"
                  weight={isCurrent ? 'semibold' : 'regular'}
                  style={isUpcoming ? stepperStyles.upcomingLabel : undefined}
                >
                  {t(step.labelKey)}
                </Text>
                {(isCompleted || isCurrent) && (
                  <Text variant="caption" color="muted">{t(step.descKey)}</Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
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
  takenBanner: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  takenRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
  takenText: { flex: 1, gap: 2 },
  section: { padding: theme.spacing.md, gap: theme.spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: { marginBottom: theme.spacing.xs },
  // Provider info
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: { flex: 1, gap: 2 },
  // Title card
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
  postedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: theme.spacing.xs },
  postedText: { flex: 1 },
  descText: { lineHeight: 22 },
  // Stats
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  flex: { flex: 1 },
  statCard: { padding: theme.spacing.md, gap: 4, alignItems: 'flex-start' },
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
});

const stepperStyles = StyleSheet.create({
  wrap: { paddingTop: theme.spacing.xs },
  stepRow: { alignItems: 'flex-start' },
  connector: {
    width: 2,
    height: 16,
    marginLeft: 10,
  },
  connectorDone:    { backgroundColor: theme.colors.success },
  connectorPending: { backgroundColor: theme.colors.border },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  iconWrap: { width: 22, alignItems: 'center', paddingTop: 1 },
  currentDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  labelWrap: { flex: 1, paddingBottom: theme.spacing.sm, gap: 2 },
  upcomingLabel: { color: theme.colors.textMuted },
});
