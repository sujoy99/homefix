import React, { useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Smartphone,
  Building2,
  Coins,
  Banknote,
  Wallet as WalletIcon,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import {
  adminService,
  WithdrawalItem,
  CompleteWithdrawalPayload,
} from '@/services/admin.service';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paisaToTaka(paisa: number): string {
  return (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function MfsIcon({ type, size = 16 }: { type: string; size?: number }) {
  switch (type) {
    case 'bkash': return <Smartphone color="#E2136E" size={size} />;
    case 'nagad': return <Smartphone color="#F7941D" size={size} />;
    case 'bank':  return <Building2 color={theme.colors.textMuted} size={size} />;
    default:      return <Coins color={theme.colors.textMuted} size={size} />;
  }
}

function StatusBadge({ status }: { status: WithdrawalItem['status'] }) {
  const { t } = useTranslation();
  const colors: Record<string, string> = {
    pending: theme.colors.warning,
    completed: theme.colors.success,
    rejected: theme.colors.error,
  };
  return (
    <View style={[badgeStyles.wrap, { borderColor: colors[status] ?? theme.colors.border }]}>
      <Text variant="caption" weight="semibold" style={{ color: colors[status] }}>
        {t(`admin_withdrawals.status_${status}` as Parameters<typeof t>[0])}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: theme.layout.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});

// ─── Complete modal ───────────────────────────────────────────────────────────

function CompleteModal({
  visible,
  onClose,
  onSubmit,
  isPending,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CompleteWithdrawalPayload) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const [amountTaka, setAmountTaka] = useState('');
  const [txid, setTxid] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const reset = () => { setAmountTaka(''); setTxid(''); setNote(''); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    const taka = parseFloat(amountTaka);
    if (isNaN(taka) || taka <= 0) { setError(t('admin_withdrawals.complete_amount_error')); return; }
    if (!txid.trim()) { setError(t('admin_withdrawals.complete_txid_error')); return; }
    setError('');
    onSubmit({
      amount_sent_paisa: Math.round(taka * 100),
      admin_txid: txid.trim(),
      sent_at: new Date().toISOString(),
      admin_note: note.trim() || undefined,
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={sheetStyles.flex}>
        <View style={sheetStyles.overlay}>
          <View style={sheetStyles.sheet}>
            <Text variant="h4" weight="bold" style={sheetStyles.title}>
              {t('admin_withdrawals.complete_title')}
            </Text>

            <Text variant="caption" color="muted" style={sheetStyles.label}>
              {t('admin_withdrawals.complete_amount_label')}
            </Text>
            <TextInput
              style={[sheetStyles.input, error ? { borderColor: theme.colors.error } : null]}
              placeholder={t('admin_withdrawals.complete_amount_placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={amountTaka}
              onChangeText={(v) => { setAmountTaka(v); setError(''); }}
              keyboardType="decimal-pad"
            />

            <Text variant="caption" color="muted" style={sheetStyles.label}>
              {t('admin_withdrawals.complete_txid_label')}
            </Text>
            <TextInput
              style={[sheetStyles.input, error ? { borderColor: theme.colors.error } : null]}
              placeholder={t('admin_withdrawals.complete_txid_placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={txid}
              onChangeText={(v) => { setTxid(v.toUpperCase()); setError(''); }}
              autoCapitalize="characters"
            />

            <Text variant="caption" color="muted" style={sheetStyles.label}>
              {t('admin_withdrawals.complete_note_label')}
            </Text>
            <TextInput
              style={sheetStyles.input}
              placeholder={t('admin_withdrawals.complete_note_placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={note}
              onChangeText={setNote}
            />

            {error ? <Text variant="caption" style={{ color: theme.colors.error }}>{error}</Text> : null}

            <View style={sheetStyles.footer}>
              <TouchableOpacity style={[sheetStyles.btn, sheetStyles.cancelBtn]} onPress={handleClose}>
                <Text variant="body" weight="semibold" color="primary">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sheetStyles.btn, sheetStyles.completeBtn, isPending && sheetStyles.disabled]}
                onPress={handleSubmit}
                disabled={isPending}
              >
                {isPending
                  ? <ActivityIndicator color={theme.colors.textInverse} size="small" />
                  : <Text variant="body" weight="semibold" color="inverse">{t('admin_withdrawals.complete_submit')}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({
  visible,
  onClose,
  onSubmit,
  isPending,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');

  const reset = () => setNote('');
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!note.trim()) return;
    onSubmit(note.trim());
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={sheetStyles.flex}>
        <View style={sheetStyles.overlay}>
          <View style={sheetStyles.sheet}>
            <Text variant="h4" weight="bold" style={sheetStyles.title}>
              {t('admin_withdrawals.reject_title')}
            </Text>

            <Text variant="caption" color="muted" style={sheetStyles.label}>
              {t('admin_withdrawals.reject_note_label')}
            </Text>
            <TextInput
              style={[sheetStyles.input, sheetStyles.textArea]}
              placeholder={t('admin_withdrawals.reject_note_placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={sheetStyles.footer}>
              <TouchableOpacity style={[sheetStyles.btn, sheetStyles.cancelBtn]} onPress={handleClose}>
                <Text variant="body" weight="semibold" color="primary">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sheetStyles.btn, sheetStyles.rejectBtn, (!note.trim() || isPending) && sheetStyles.disabled]}
                onPress={handleSubmit}
                disabled={!note.trim() || isPending}
              >
                {isPending
                  ? <ActivityIndicator color={theme.colors.textInverse} size="small" />
                  : <Text variant="body" weight="semibold" color="inverse">{t('admin_withdrawals.reject_submit')}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.layout.radius.xl,
    borderTopRightRadius: theme.layout.radius.xl,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  title: { marginBottom: theme.spacing.sm },
  label: { marginTop: theme.spacing.sm, marginBottom: 4 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  textArea: { height: 88, paddingTop: theme.spacing.sm },
  footer: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  btn: { flex: 1, height: 48, borderRadius: theme.layout.radius.lg, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 1.5, borderColor: theme.colors.primary },
  completeBtn: { backgroundColor: theme.colors.success },
  rejectBtn: { backgroundColor: theme.colors.error },
  disabled: { opacity: 0.5 },
});

// ─── Withdrawal row ───────────────────────────────────────────────────────────

function WithdrawalRow({
  item,
  onComplete,
  onReject,
  isActing,
}: {
  item: WithdrawalItem;
  onComplete: (item: WithdrawalItem) => void;
  onReject: (item: WithdrawalItem) => void;
  isActing: boolean;
}) {
  const { t } = useTranslation();
  const isPending = item.status === 'pending';
  const balancePaisa = item.wallet?.balance_paisa ?? null;
  const totalPendingPaisa = item.total_pending_paisa ?? 0;
  const availableBalance = balancePaisa !== null ? balancePaisa - totalPendingPaisa : null;
  const balanceInsufficient = availableBalance !== null && availableBalance < 0;

  return (
    <Card style={rowStyles.card}>
      {/* Header: provider name + status */}
      <View style={rowStyles.header}>
        <View style={rowStyles.headerLeft}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {item.provider?.full_name ?? t('admin_withdrawals.unknown_provider')}
          </Text>
          <Text variant="caption" color="muted">{item.provider?.mobile ?? '—'}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* MFS account */}
      {item.mfsAccount ? (
        <View style={rowStyles.infoRow}>
          <MfsIcon type={item.mfsAccount.mfs_type} />
          <Text variant="caption" color="muted" style={rowStyles.gap}>
            {item.mfsAccount.mfs_type.toUpperCase()} · {item.mfsAccount.account_number}
          </Text>
          <Text variant="caption" color="muted"> · {item.mfsAccount.account_name}</Text>
        </View>
      ) : null}

      {/* Requested amount */}
      <View style={rowStyles.infoRow}>
        <Banknote color={theme.colors.primary} size={14} />
        <Text variant="body" weight="bold" style={[rowStyles.gap, rowStyles.amount]}>
          ৳{paisaToTaka(item.amount_requested_paisa)}
        </Text>
        <Text variant="caption" color="muted"> {t('admin_withdrawals.requested')}</Text>
      </View>

      {/* Wallet balance breakdown */}
      {balancePaisa !== null ? (
        <View style={[rowStyles.balanceBox, balanceInsufficient && rowStyles.warningBox]}>
          <View style={rowStyles.balanceRow}>
            <WalletIcon color={balanceInsufficient ? theme.colors.warning : theme.colors.textMuted} size={13} />
            <Text variant="caption" style={[rowStyles.gap, { color: theme.colors.textMuted }]}>
              {t('admin_withdrawals.wallet_balance')}: ৳{paisaToTaka(balancePaisa)}
            </Text>
          </View>
          {totalPendingPaisa > 0 && (
            <View style={rowStyles.balanceRow}>
              <Clock color={theme.colors.warning} size={13} />
              <Text variant="caption" style={[rowStyles.gap, { color: theme.colors.warning }]}>
                {t('admin_withdrawals.total_pending')}: ৳{paisaToTaka(totalPendingPaisa)}
              </Text>
            </View>
          )}
          <View style={rowStyles.balanceRow}>
            {balanceInsufficient
              ? <AlertTriangle color={theme.colors.error} size={13} />
              : <CheckCircle2 color={theme.colors.success} size={13} />
            }
            <Text
              variant="caption"
              weight="semibold"
              style={[rowStyles.gap, { color: balanceInsufficient ? theme.colors.error : theme.colors.success }]}
            >
              {t('admin_withdrawals.net_available')}: ৳{paisaToTaka(Math.max(0, availableBalance ?? 0))}
              {balanceInsufficient ? ` ⚠ ${t('admin_withdrawals.balance_warning')}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Amount sent (completed) */}
      {item.amount_sent_paisa != null ? (
        <View style={rowStyles.infoRow}>
          <Check color={theme.colors.success} size={14} />
          <Text variant="caption" style={[rowStyles.gap, { color: theme.colors.success }]}>
            {t('admin_withdrawals.sent')}: ৳{paisaToTaka(item.amount_sent_paisa)}
          </Text>
        </View>
      ) : null}

      {/* Date */}
      <View style={rowStyles.infoRow}>
        <Clock color={theme.colors.textMuted} size={12} />
        <Text variant="caption" color="muted" style={rowStyles.gap}>{formatDate(item.requested_at)}</Text>
      </View>

      {/* Admin TxID (completed) */}
      {item.admin_txid ? (
        <View style={rowStyles.infoRow}>
          <Text variant="caption" color="muted">TxID: </Text>
          <Text variant="caption" weight="medium">{item.admin_txid}</Text>
        </View>
      ) : null}

      {/* Admin note */}
      {item.admin_note ? (
        <Text variant="caption" color="muted" style={rowStyles.note}>{item.admin_note}</Text>
      ) : null}

      {/* Actions — only for pending */}
      {isPending && (
        <View style={rowStyles.actions}>
          <TouchableOpacity
            style={[rowStyles.actionBtn, rowStyles.completeBtn, isActing && rowStyles.disabled]}
            onPress={() => onComplete(item)}
            disabled={isActing}
            accessibilityRole="button"
          >
            <Check color={theme.colors.textInverse} size={16} />
            <Text variant="body" weight="semibold" color="inverse">
              {t('admin_withdrawals.complete')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[rowStyles.actionBtn, rowStyles.rejectBtn, isActing && rowStyles.disabled]}
            onPress={() => onReject(item)}
            disabled={isActing}
            accessibilityRole="button"
          >
            <X color={theme.colors.error} size={16} />
            <Text variant="body" weight="semibold" style={{ color: theme.colors.error }}>
              {t('admin_withdrawals.reject')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

const rowStyles = StyleSheet.create({
  card: { padding: theme.spacing.md, gap: theme.spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, marginRight: theme.spacing.sm, gap: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  balanceBox: {
    borderRadius: theme.layout.radius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xs,
    gap: 3,
    marginTop: 2,
  },
  warningBox: { borderColor: theme.colors.error, backgroundColor: `${theme.colors.error}08` },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  gap: { marginLeft: 4 },
  amount: { color: theme.colors.primary },
  note: { fontStyle: 'italic', marginTop: 2 },
  actions: { gap: theme.spacing.xs, marginTop: theme.spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    height: 44,
    borderRadius: theme.layout.radius.lg,
  },
  completeBtn: { backgroundColor: theme.colors.success },
  rejectBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminWithdrawalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState<WithdrawalItem | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: withdrawals = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['adminWithdrawals'],
    queryFn: adminService.listWithdrawals,
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteWithdrawalPayload }) =>
      adminService.completeWithdrawal(id, data),
    onSuccess: () => {
      toast.success(t('admin_withdrawals.complete_success'));
      setShowCompleteModal(false);
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
    },
    onError: () => toast.error(t('admin_withdrawals.complete_error')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      adminService.rejectWithdrawal(id, note),
    onSuccess: () => {
      toast.success(t('admin_withdrawals.reject_success'));
      setShowRejectModal(false);
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
    },
    onError: () => toast.error(t('admin_withdrawals.reject_error')),
  });

  const handleComplete = (item: WithdrawalItem) => {
    setSelectedItem(item);
    setShowCompleteModal(true);
  };

  const handleReject = (item: WithdrawalItem) => {
    setSelectedItem(item);
    setShowRejectModal(true);
  };

  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length;
  const isActing = completeMutation.isPending || rejectMutation.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" style={styles.headerTitle}>
          {t('admin_withdrawals.title')}
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
          data={withdrawals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, withdrawals.length === 0 && styles.listEmpty]}
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
            pendingCount > 0 ? (
              <View style={styles.countRow}>
                <Clock color={theme.colors.warning} size={16} />
                <Text variant="caption" color="muted" style={styles.countText}>
                  {t('admin_withdrawals.pending_count', { count: pendingCount })}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <CheckCircle2 color={theme.colors.success} size={48} />
              <Text variant="h4" weight="semibold" align="center" style={styles.emptyTitle}>
                {t('admin_withdrawals.empty_title')}
              </Text>
              <Text variant="body" color="muted" align="center">
                {t('admin_withdrawals.empty_desc')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <WithdrawalRow
              item={item}
              onComplete={handleComplete}
              onReject={handleReject}
              isActing={isActing}
            />
          )}
        />
      )}

      <CompleteModal
        visible={showCompleteModal}
        onClose={() => { setShowCompleteModal(false); setSelectedItem(null); }}
        onSubmit={(data) => selectedItem && completeMutation.mutate({ id: selectedItem.id, data })}
        isPending={completeMutation.isPending}
      />

      <RejectModal
        visible={showRejectModal}
        onClose={() => { setShowRejectModal(false); setSelectedItem(null); }}
        onSubmit={(note) => selectedItem && rejectMutation.mutate({ id: selectedItem.id, note })}
        isPending={rejectMutation.isPending}
      />
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
});
