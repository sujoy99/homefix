import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Layers,
  BarChart2,
  Briefcase,
  ChevronRight,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import {
  adminService,
  type RevenuePeriodRow,
  type RevenueRuleRow,
  type RevenueCategoryRow,
  type RevenueJobRow,
} from '@/services/admin.service';
import { theme } from '@/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paisaToTaka(paisa: number): string {
  return (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

type Period = 'monthly' | 'daily';

// ─── Period toggle ────────────────────────────────────────────────────────────

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const { t } = useTranslation();
  return (
    <View style={toggleStyles.wrap}>
      {(['monthly', 'daily'] as Period[]).map((p) => (
        <TouchableOpacity
          key={p}
          style={[toggleStyles.btn, value === p && toggleStyles.active]}
          onPress={() => onChange(p)}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === p }}
        >
          <Text
            variant="caption"
            weight={value === p ? 'semibold' : 'regular'}
            style={value === p ? toggleStyles.activeText : undefined}
          >
            {t(`revenue.period_${p}` as Parameters<typeof t>[0])}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.full,
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },
  btn: { paddingHorizontal: 14, paddingVertical: 6 },
  active: { backgroundColor: theme.colors.primary },
  activeText: { color: theme.colors.textInverse },
});

// ─── Period bar chart (text-based) ────────────────────────────────────────────

function PeriodBars({ rows }: { rows: RevenuePeriodRow[] }) {
  const { t } = useTranslation();
  if (rows.length === 0) {
    return <Text variant="caption" color="muted">{t('revenue.no_period_data')}</Text>;
  }
  const max = Math.max(...rows.map((r) => r.total_paisa), 1);
  const recent = rows.slice(-8);

  return (
    <View style={barChartStyles.wrap}>
      {recent.map((row) => {
        const pct = (row.total_paisa / max) * 100;
        return (
          <View key={row.date} style={barChartStyles.row}>
            <Text variant="caption" color="muted" style={barChartStyles.label}>
              {row.date.slice(0, 7)}
            </Text>
            <View style={barChartStyles.track}>
              <View style={[barChartStyles.fill, { width: `${pct}%` as `${number}%` }]} />
            </View>
            <Text variant="caption" weight="medium" style={barChartStyles.value}>
              ৳{paisaToTaka(row.total_paisa)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const barChartStyles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  label: { width: 60 },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  value: { width: 64, textAlign: 'right' },
});

// ─── Rule breakdown row ───────────────────────────────────────────────────────

function RuleRow({ rule }: { rule: RevenueRuleRow }) {
  const { t } = useTranslation();
  const scopeKey = `revenue.rule_${rule.scope}` as Parameters<typeof t>[0];
  return (
    <View style={ruleStyles.row}>
      <View style={ruleStyles.info}>
        <Text variant="body" weight="medium">{rule.label}</Text>
        <Text variant="caption" color="muted">
          {t(scopeKey)} · {t('revenue.rate_label')}: {parseFloat(rule.rate) * 100}%
        </Text>
      </View>
      <Text variant="body" weight="semibold">৳{paisaToTaka(rule.total_paisa)}</Text>
    </View>
  );
}

const ruleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  info: { flex: 1, gap: 2 },
});

// ─── Category row ─────────────────────────────────────────────────────────────

function CategoryRow({ cat, rank }: { cat: RevenueCategoryRow; rank: number }) {
  return (
    <View style={catStyles.row}>
      <View style={catStyles.rank}>
        <Text variant="caption" weight="bold" color="primary">#{rank}</Text>
      </View>
      <Text variant="body" weight="medium" style={catStyles.name}>{cat.name}</Text>
      <Text variant="body" weight="semibold">৳{paisaToTaka(cat.total_paisa)}</Text>
    </View>
  );
}

const catStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { flex: 1 },
});

// ─── Job detail row ───────────────────────────────────────────────────────────

function JobDetailRow({ job }: { job: RevenueJobRow }) {
  const { t } = useTranslation();
  return (
    <View style={jobStyles.row}>
      <View style={jobStyles.info}>
        <Text variant="caption" weight="medium">{job.category_name}</Text>
        <Text variant="caption" color="muted">
          {formatDate(job.created_at)} · {job.method.toUpperCase()} · {parseFloat(job.commission_rate) * 100}%
        </Text>
        <Text variant="caption" color="muted">
          {t('revenue.job_row_payment')}: ৳{paisaToTaka(job.payment_amount_paisa)}
        </Text>
      </View>
      <Text variant="caption" weight="semibold" style={jobStyles.commission}>
        +৳{paisaToTaka(job.revenue_paisa)}
      </Text>
    </View>
  );
}

const jobStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  info: { flex: 1, gap: 2 },
  commission: { color: theme.colors.success, marginTop: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RevenueScreen() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('monthly');
  const [showAllJobs, setShowAllJobs] = useState(false);

  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['adminRevenue', period],
    queryFn: () => adminService.getRevenueDashboard({ period }),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['adminRevenueJobs'],
    queryFn: () => adminService.getRevenueJobs(),
    enabled: showAllJobs,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title={t('revenue.title')} />
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (isError || !dashboard) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title={t('revenue.title')} />
        <View style={styles.errorWrap}>
          <Text variant="body" color="muted" align="center">{t('revenue.load_error')}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text variant="body" color="primary">{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const visibleJobs = showAllJobs
    ? (jobsData?.items ?? [])
    : dashboard.top_categories.length > 0
      ? []
      : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={t('revenue.title')} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Total revenue hero */}
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <TrendingUp color={theme.colors.textInverse} size={22} />
          </View>
          <Text variant="caption" color="muted">{t('revenue.total_revenue')}</Text>
          <Text variant="h2" weight="bold">৳{paisaToTaka(dashboard.total_revenue_paisa)}</Text>
        </Card>

        {/* Period chart */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <BarChart2 color={theme.colors.primary} size={16} />
              <Text variant="body" weight="semibold">{t('revenue.by_period')}</Text>
            </View>
            <PeriodToggle value={period} onChange={setPeriod} />
          </View>
          <PeriodBars rows={dashboard.revenue_by_period} />
        </Card>

        {/* Rule breakdown */}
        <Card style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Layers color={theme.colors.primary} size={16} />
            <Text variant="body" weight="semibold">{t('revenue.by_rule')}</Text>
          </View>
          {dashboard.breakdown_by_rule.length === 0 ? (
            <Text variant="caption" color="muted">{t('revenue.no_rule_data')}</Text>
          ) : (
            dashboard.breakdown_by_rule.map((rule, idx) => (
              <View key={rule.rule_id}>
                {idx > 0 && <View style={styles.divider} />}
                <RuleRow rule={rule} />
              </View>
            ))
          )}
        </Card>

        {/* Top categories */}
        <Card style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Layers color={theme.colors.secondary} size={16} />
            <Text variant="body" weight="semibold">{t('revenue.top_categories')}</Text>
          </View>
          {dashboard.top_categories.length === 0 ? (
            <Text variant="caption" color="muted">{t('revenue.no_category_data')}</Text>
          ) : (
            dashboard.top_categories.map((cat, idx) => (
              <View key={cat.category_id}>
                {idx > 0 && <View style={styles.divider} />}
                <CategoryRow cat={cat} rank={idx + 1} />
              </View>
            ))
          )}
        </Card>

        {/* Per-job detail */}
        <Card style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowAllJobs((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={t('revenue.per_job')}
          >
            <View style={styles.sectionTitleRow}>
              <Briefcase color={theme.colors.primary} size={16} />
              <Text variant="body" weight="semibold">{t('revenue.per_job')}</Text>
            </View>
            <ChevronRight
              color={theme.colors.textMuted}
              size={18}
              style={showAllJobs ? { transform: [{ rotate: '90deg' }] } : undefined}
            />
          </TouchableOpacity>

          {showAllJobs && (
            <>
              {!jobsData ? (
                <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 8 }} />
              ) : jobsData.items.length === 0 ? (
                <Text variant="caption" color="muted">{t('revenue.no_jobs')}</Text>
              ) : (
                jobsData.items.map((job, idx) => (
                  <View key={job.ledger_id}>
                    {idx > 0 && <View style={styles.divider} />}
                    <JobDetailRow job={job} />
                  </View>
                ))
              )}
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Text variant="h4" weight="bold">{title}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    height: 56,
    justifyContent: 'center',
  },
  loader: { marginTop: theme.spacing['2xl'] },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
  retryBtn: { paddingVertical: theme.spacing.sm },
  scroll: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl, gap: theme.spacing.sm },
  heroCard: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    alignItems: 'flex-start',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  section: { padding: theme.spacing.md, gap: theme.spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 2 },
});
