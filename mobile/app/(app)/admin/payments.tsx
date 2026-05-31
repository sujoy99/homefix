import React, { useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, Smartphone, CreditCard, Building2, Coins, Banknote } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminService, PendingPayment } from '@/services/admin.service';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

// ─── Method icon helper ───────────────────────────────────────────────────────

function MethodIcon({ method, size = 16 }: { method: string; size?: number }) {
  const color = theme.colors.textMuted;
  switch (method) {
    case 'bkash':        return <Smartphone color="#E2136E" size={size} />;
    case 'nagad':        return <Smartphone color="#F7941D" size={size} />;
    case 'card':         return <CreditCard color={color} size={size} />;
    case 'bank_transfer':return <Building2 color={color} size={size} />;
    default:             return <Coins color={color} size={size} />;
  }
}

// ─── Payment row ─────────────────────────────────────────────────────────────

function PaymentRow({ item, onVerify, isVerifying }: {
  item: PendingPayment;
  onVerify: (id: string) => void;
  isVerifying: boolean;
}) {
  const { t } = useTranslation();
  const amountTaka = (item.amount_paisa / 100).toFixed(0);
  const date = new Date(item.created_at).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Card style={styles.row}>
      {/* Header: category + amount */}
      <View style={styles.rowHeader}>
        <View style={styles.rowMeta}>
          <Text variant="body" weight="semibold" numberOfLines={1} style={styles.rowTitle}>
            {item.job_title ?? item.category_name}
          </Text>
          <Text variant="caption" color="muted">{item.category_name}</Text>
        </View>
        <View style={styles.amountBadge}>
          <Banknote color={theme.colors.primary} size={14} />
          <Text variant="body" weight="bold" style={styles.amountText}>৳{amountTaka}</Text>
        </View>
      </View>

      {/* Resident info */}
      <View style={styles.infoRow}>
        <Text variant="caption" color="muted">{t('admin_payments.resident')}: </Text>
        <Text variant="caption" weight="medium">{item.resident_name}</Text>
        <Text variant="caption" color="muted"> · {item.resident_mobile}</Text>
      </View>

      {/* Method + TxID */}
      <View style={styles.infoRow}>
        <MethodIcon method={item.method} />
        <Text variant="caption" color="muted" style={styles.infoGap}>
          {item.method.replace('_', ' ').toUpperCase()}
        </Text>
        {item.transaction_id ? (
          <>
            <Text variant="caption" color="muted"> · TxID: </Text>
            <Text variant="caption" weight="medium">{item.transaction_id}</Text>
          </>
        ) : null}
      </View>

      {/* Submitted date */}
      <View style={styles.infoRow}>
        <Clock color={theme.colors.textMuted} size={12} />
        <Text variant="caption" color="muted" style={styles.infoGap}>{date}</Text>
      </View>

      {/* Verify CTA */}
      <View style={styles.rowFooter}>
        <Button
          label={isVerifying ? t('admin_payments.verifying') : t('admin_payments.verify')}
          variant="primary"
          size="sm"
          disabled={isVerifying}
          onPress={() => onVerify(item.id)}
        />
      </View>
    </Card>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminPaymentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const { data: payments = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['adminPendingPayments'],
    queryFn: adminService.listPendingPayments,
  });

  const verifyMutation = useMutation({
    mutationFn: adminService.verifyPayment,
    onMutate: (id) => setVerifyingId(id),
    onSuccess: () => {
      toast.success(t('admin_payments.verified_success'));
      queryClient.invalidateQueries({ queryKey: ['adminPendingPayments'] });
      queryClient.invalidateQueries({ queryKey: ['revenueDashboard'] });
    },
    onError: () => {
      toast.error(t('admin_payments.verified_error'));
    },
    onSettled: () => setVerifyingId(null),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" style={styles.headerTitle}>
          {t('admin_payments.title')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : isError ? (
        <View style={styles.emptyWrap}>
          <Text variant="body" color="muted" align="center">{t('common.error')}</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            payments.length === 0 && styles.listEmpty,
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
          ListHeaderComponent={
            payments.length > 0 ? (
              <View style={styles.countRow}>
                <CheckCircle2 color={theme.colors.warning} size={16} />
                <Text variant="caption" color="muted" style={styles.countText}>
                  {t('admin_payments.pending_count', { count: payments.length })}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <CheckCircle2 color={theme.colors.success} size={48} />
              <Text variant="h4" weight="semibold" align="center" style={styles.emptyTitle}>
                {t('admin_payments.empty_title')}
              </Text>
              <Text variant="body" color="muted" align="center">
                {t('admin_payments.empty_desc')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PaymentRow
              item={item}
              onVerify={(id) => verifyMutation.mutate(id)}
              isVerifying={verifyingId === item.id}
            />
          )}
        />
      )}
    </SafeAreaView>
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
  backBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loader: { marginTop: theme.spacing['2xl'] },
  list: { padding: theme.spacing.md, paddingBottom: 32, gap: theme.spacing.sm },
  listEmpty: { flexGrow: 1 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  countText: { marginLeft: theme.spacing.xs },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyTitle: { marginTop: theme.spacing.sm },
  // Row
  row: { padding: theme.spacing.md, gap: theme.spacing.xs },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowMeta: { flex: 1, marginRight: theme.spacing.sm },
  rowTitle: { flexShrink: 1 },
  amountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amountText: { color: theme.colors.primary },
  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  infoGap: { marginLeft: 4 },
  rowFooter: { marginTop: theme.spacing.sm, alignSelf: 'flex-end' },
});
