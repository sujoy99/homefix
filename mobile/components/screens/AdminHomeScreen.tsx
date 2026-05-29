import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { adminService, type PendingProvider } from '@/services/admin.service';
import { theme } from '@/theme';

function PendingProviderCard({
  item,
  onApprove,
  onReject,
  isLoading,
}: {
  item: PendingProvider;
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const date = new Date(item.created_at).toLocaleDateString();

  return (
    <Card style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <View style={styles.avatar}>
          <User color={theme.colors.primary} size={22} />
        </View>
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
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={onApprove}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <CheckCircle color={theme.colors.surface} size={16} />
          <Text variant="caption" weight="semibold" color="inverse" style={styles.btnLabel}>
            {t('admin.approve')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={onReject}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <XCircle color={theme.colors.surface} size={16} />
          <Text variant="caption" weight="semibold" color="inverse" style={styles.btnLabel}>
            {t('admin.reject')}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function AdminHomeScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: pending = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'pending-providers'],
    queryFn: adminService.listPending,
  });

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: (id: string) => adminService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-providers'] });
    },
    onError: () => Alert.alert(t('common.error'), t('admin.approve_error')),
  });

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: (id: string) => adminService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-providers'] });
    },
    onError: () => Alert.alert(t('common.error'), t('admin.reject_error')),
  });

  const confirmApprove = (item: PendingProvider) => {
    Alert.alert(
      t('admin.approve_confirm_title'),
      t('admin.approve_confirm_desc', { name: item.full_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.approve'), onPress: () => approve(item.id) },
      ]
    );
  };

  const confirmReject = (item: PendingProvider) => {
    Alert.alert(
      t('admin.reject_confirm_title'),
      t('admin.reject_confirm_desc', { name: item.full_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.reject'),
          style: 'destructive',
          onPress: () => reject(item.id),
        },
      ]
    );
  };

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
              onApprove={() => confirmApprove(item)}
              onReject={() => confirmReject(item)}
              isLoading={approving || rejecting}
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
  providerInfo: { flex: 1, gap: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dateText: { marginTop: 1 },
  actionRow: { flexDirection: 'row', gap: theme.spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: theme.layout.radius.md,
  },
  approveBtn: { backgroundColor: theme.colors.success },
  rejectBtn: { backgroundColor: theme.colors.error },
  btnLabel: { marginTop: 1 },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: theme.spacing['2xl'],
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: { marginTop: theme.spacing.xs },
});
