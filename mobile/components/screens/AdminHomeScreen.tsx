import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, User, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { adminService, type PendingProvider } from '@/services/admin.service';
import { theme } from '@/theme';

function PendingProviderCard({ item, onPress }: { item: PendingProvider; onPress: () => void }) {
  const { t } = useTranslation();
  const date = new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <Card style={styles.providerCard}>
        <View style={styles.providerHeader}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User color={theme.colors.primary} size={22} />
            </View>
          )}
          <View style={styles.providerInfo}>
            <Text variant="body" weight="semibold">{item.full_name}</Text>
            <Text variant="caption" color="muted">{item.mobile}</Text>
            {item.email ? (
              <Text variant="caption" color="muted">{item.email}</Text>
            ) : null}
            <View style={styles.dateRow}>
              <Clock color={theme.colors.textMuted} size={11} />
              <Text variant="caption" color="muted" style={styles.dateText}>
                {t('admin.registered')} {date}
              </Text>
            </View>
          </View>
          <ChevronRight color={theme.colors.textMuted} size={18} />
        </View>
        <Text variant="caption" color="primary" style={styles.tapHint}>
          {t('admin_detail.tap_to_review')}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

export default function AdminHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: pending = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'pending-providers'],
    queryFn: adminService.listPending,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h3" weight="bold">{t('admin.title')}</Text>
        <Text variant="caption" color="muted">{t('admin.subtitle')}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text variant="h4" weight="semibold">{t('admin.pending_title')}</Text>
        {pending.length > 0 && (
          <View style={styles.badge}>
            <Text variant="caption" weight="bold" color="inverse">{pending.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <CheckCircle color={theme.colors.success} size={40} />
              <Text variant="body" weight="semibold" style={styles.emptyTitle}>
                {t('admin.no_pending')}
              </Text>
              <Text variant="caption" color="muted" align="center">
                {t('admin.no_pending_desc')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PendingProviderCard
              item={item}
              onPress={() => router.push(`/(app)/admin/provider/${item.id}` as never)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.layout.radius.full,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: { marginTop: theme.spacing.xl },
  list: { padding: theme.spacing.md, gap: theme.spacing.sm },
  providerCard: { padding: theme.spacing.md },
  providerHeader: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: { overflow: 'hidden' },
  providerInfo: { flex: 1, gap: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dateText: { marginTop: 1 },
  tapHint: { marginTop: theme.spacing.xs },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: theme.spacing['2xl'],
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: { marginTop: theme.spacing.xs },
});
