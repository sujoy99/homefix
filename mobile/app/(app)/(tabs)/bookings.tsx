import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plus, CalendarDays } from 'lucide-react-native';
import { JobStatus } from '@homefix/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { JobCard } from '@/components/shared/JobCard';
import { jobService, Job } from '@/services/job.service';
import { categoryService } from '@/services/category.service';
import { theme } from '@/theme';

// ── Tab definitions ──────────────────────────────────────────────────────────
type TabKey = 'upcoming' | 'active' | 'awaiting' | 'completed';

type TabDef = {
  key: TabKey;
  labelKey: string;
  statuses: JobStatus[];
  emptyTitleKey: string;
  emptyDescKey: string;
};

const TABS: TabDef[] = [
  {
    key: 'upcoming',
    labelKey: 'bookings.tab_upcoming',
    statuses: [JobStatus.PENDING],
    emptyTitleKey: 'bookings.empty_upcoming_title',
    emptyDescKey: 'bookings.empty_upcoming_desc',
  },
  {
    key: 'active',
    labelKey: 'bookings.tab_active',
    statuses: [JobStatus.ACTIVE],
    emptyTitleKey: 'bookings.empty_active_title',
    emptyDescKey: 'bookings.empty_active_desc',
  },
  {
    key: 'awaiting',
    labelKey: 'bookings.tab_awaiting',
    statuses: [JobStatus.AWAITING_PAYMENT],
    emptyTitleKey: 'bookings.empty_awaiting_title',
    emptyDescKey: 'bookings.empty_awaiting_desc',
  },
  {
    key: 'completed',
    labelKey: 'bookings.tab_completed',
    statuses: [JobStatus.PAID, JobStatus.CANCELLED],
    emptyTitleKey: 'bookings.empty_completed_title',
    emptyDescKey: 'bookings.empty_completed_desc',
  },
];

export default function BookingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  const {
    data: jobs = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['myJobs'],
    queryFn: jobService.getMyJobs,
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

  const currentTab = TABS.find((t) => t.key === activeTab)!;
  const filtered = jobs.filter((j) => currentTab.statuses.includes(j.status));

  const handleJobPress = (job: Job) => {
    router.push(`/(app)/booking/job/${job.id}` as never);
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <CalendarDays color={theme.colors.primary} size={48} />
      <Text variant="h4" weight="semibold" align="center" style={styles.emptyTitle}>
        {t(currentTab.emptyTitleKey)}
      </Text>
      <Text variant="body" color="muted" align="center" style={styles.emptyDesc}>
        {t(currentTab.emptyDescKey)}
      </Text>
      {activeTab === 'upcoming' && (
        <Button
          label={t('bookings.new_booking')}
          variant="primary"
          size="md"
          style={styles.emptyBtn}
          onPress={() => router.push('/(app)/booking/create' as never)}
        />
      )}
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyWrap}>
      <Text variant="body" color="muted" align="center">{t('bookings.load_error')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2" weight="bold">{t('bookings.title')}</Text>
        <TouchableOpacity
          testID="new-booking-fab"
          style={styles.fab}
          onPress={() => router.push('/(app)/booking/create' as never)}
          hitSlop={8}
          activeOpacity={0.8}
        >
          <Plus color={theme.colors.textInverse} size={20} />
        </TouchableOpacity>
      </View>

      {/* Status tab filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const count = jobs.filter((j) => tab.statuses.includes(j.status)).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                variant="caption"
                weight={isActive ? 'semibold' : 'regular'}
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {t(tab.labelKey)}
                {count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Job list */}
      {isError ? (
        renderError()
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={isLoading ? null : renderEmpty()}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              categoryName={categoryMap.get(item.category_id)}
              onPress={() => handleJobPress(item)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  fab: {
    width: 36,
    height: 36,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.layout.shadow.sm,
  },
  // Tabs
  tabScroll: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexGrow: 0,
  },
  tabRow: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabLabel: {
    color: theme.colors.textMuted,
  },
  tabLabelActive: {
    color: theme.colors.textInverse,
  },
  // List
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  // Empty state
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
  emptyBtn: {
    marginTop: theme.spacing.sm,
    alignSelf: 'stretch',
  },
});
