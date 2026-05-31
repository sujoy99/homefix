import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  ArrowDownCircle,
  Plus,
  Info,
  Trash2,
  Star,
  ChevronDown,
} from 'lucide-react-native';
import { MfsType } from '@homefix/shared';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { paymentService, WalletTransaction, MfsAccount } from '@/services/payment.service';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paisaToTaka(paisa: number): string {
  return (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const MFS_LABELS: Record<MfsType, string> = {
  [MfsType.BKASH]: 'wallet.mfs_type_bkash',
  [MfsType.NAGAD]: 'wallet.mfs_type_nagad',
  [MfsType.BANK]: 'wallet.mfs_type_bank',
};

// ─── Balance card ─────────────────────────────────────────────────────────────

function BalanceCard({
  balancePaisa,
  totalEarnedPaisa,
  totalWithdrawnPaisa,
  onWithdraw,
}: {
  balancePaisa: number;
  totalEarnedPaisa: number;
  totalWithdrawnPaisa: number;
  onWithdraw: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card style={balanceStyles.card}>
      <View style={balanceStyles.balanceRow}>
        <View style={balanceStyles.balanceIcon}>
          <Wallet color={theme.colors.textInverse} size={22} />
        </View>
        <View style={balanceStyles.balanceText}>
          <Text variant="caption" color="muted">{t('wallet.balance')}</Text>
          <Text variant="h2" weight="bold">৳{paisaToTaka(balancePaisa)}</Text>
        </View>
      </View>

      <View style={balanceStyles.statsRow}>
        <View style={balanceStyles.stat}>
          <Text variant="caption" color="muted">{t('wallet.total_earned')}</Text>
          <Text variant="body" weight="semibold">৳{paisaToTaka(totalEarnedPaisa)}</Text>
        </View>
        <View style={balanceStyles.statDivider} />
        <View style={balanceStyles.stat}>
          <Text variant="caption" color="muted">{t('wallet.total_withdrawn')}</Text>
          <Text variant="body" weight="semibold">৳{paisaToTaka(totalWithdrawnPaisa)}</Text>
        </View>
      </View>

      <Button label={t('wallet.withdraw')} variant="primary" onPress={onWithdraw} />
    </Card>
  );
}

const balanceStyles = StyleSheet.create({
  card: { padding: theme.spacing.md, gap: theme.spacing.md },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceText: { gap: 2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: theme.colors.border },
});

// ─── Transaction item ─────────────────────────────────────────────────────────

function TxItem({ tx }: { tx: WalletTransaction }) {
  const { t } = useTranslation();
  const isCredit = tx.type === 'credit';
  return (
    <View style={txStyles.row}>
      <View style={[txStyles.dot, isCredit ? txStyles.creditDot : txStyles.withdrawalDot]} />
      <View style={txStyles.info}>
        <Text variant="body" weight="medium">
          {isCredit ? t('wallet.tx_credit') : t('wallet.tx_withdrawal')}
        </Text>
        <Text variant="caption" color="muted">{formatDate(tx.created_at)}</Text>
      </View>
      <Text
        variant="body"
        weight="semibold"
        style={isCredit ? txStyles.creditAmt : txStyles.withdrawalAmt}
      >
        {isCredit ? '+' : '-'}৳{paisaToTaka(tx.amount_paisa)}
      </Text>
    </View>
  );
}

const txStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  creditDot: { backgroundColor: theme.colors.success },
  withdrawalDot: { backgroundColor: theme.colors.error },
  info: { flex: 1, gap: 2 },
  creditAmt: { color: theme.colors.success },
  withdrawalAmt: { color: theme.colors.error },
});

// ─── MFS Account item ─────────────────────────────────────────────────────────

function AccountItem({
  account,
  onSetPrimary,
  onRemove,
}: {
  account: MfsAccount;
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={acctStyles.row}>
      <View style={acctStyles.info}>
        <Text variant="body" weight="medium">
          {t(MFS_LABELS[account.mfs_type] as Parameters<typeof t>[0])} · {account.account_number}
        </Text>
        <Text variant="caption" color="muted">{account.account_name}</Text>
      </View>
      <View style={acctStyles.actions}>
        {account.is_primary ? (
          <View style={acctStyles.primaryBadge}>
            <Star color={theme.colors.textInverse} size={11} fill={theme.colors.textInverse} />
            <Text variant="caption" color="inverse" weight="semibold">{t('wallet.account_primary')}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onSetPrimary(account.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('wallet.set_primary')}
          >
            <Text variant="caption" color="primary">{t('wallet.set_primary')}</Text>
          </TouchableOpacity>
        )}
        {!account.is_primary && (
          <TouchableOpacity
            onPress={() => onRemove(account.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('wallet.remove_account')}
          >
            <Trash2 color={theme.colors.error} size={16} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const acctStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  info: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.layout.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});

// ─── Add account modal ────────────────────────────────────────────────────────

const MFS_TYPES = [MfsType.BKASH, MfsType.NAGAD, MfsType.BANK];

function AddAccountModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { mfs_type: MfsType; account_number: string; account_name: string }) => void;
}) {
  const { t } = useTranslation();
  const [mfsType, setMfsType] = useState<MfsType>(MfsType.BKASH);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const reset = () => { setNumber(''); setName(''); setMfsType(MfsType.BKASH); };

  const handleAdd = () => {
    if (!number.trim() || !name.trim()) return;
    onAdd({ mfs_type: mfsType, account_number: number.trim(), account_name: name.trim() });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text variant="h4" weight="bold" style={modalStyles.title}>{t('wallet.add_account_title')}</Text>

          {/* Type picker */}
          <Text variant="caption" color="muted" style={modalStyles.label}>{t('wallet.mfs_type_label')}</Text>
          <TouchableOpacity
            style={modalStyles.typePicker}
            onPress={() => setShowTypePicker(true)}
            accessibilityRole="button"
          >
            <Text variant="body">{t(MFS_LABELS[mfsType] as Parameters<typeof t>[0])}</Text>
            <ChevronDown color={theme.colors.textMuted} size={18} />
          </TouchableOpacity>

          {showTypePicker && (
            <View style={modalStyles.typeList}>
              {MFS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={modalStyles.typeOption}
                  onPress={() => { setMfsType(type); setShowTypePicker(false); }}
                >
                  <Text variant="body" weight={mfsType === type ? 'semibold' : 'regular'}>
                    {t(MFS_LABELS[type] as Parameters<typeof t>[0])}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text variant="caption" color="muted" style={modalStyles.label}>{t('wallet.account_number_label')}</Text>
          <TextInput
            style={modalStyles.input}
            placeholder={t('wallet.account_number_placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={number}
            onChangeText={setNumber}
            keyboardType="phone-pad"
            accessibilityLabel={t('wallet.account_number_label')}
          />

          <Text variant="caption" color="muted" style={modalStyles.label}>{t('wallet.account_name_label')}</Text>
          <TextInput
            style={modalStyles.input}
            placeholder={t('wallet.account_name_placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
            accessibilityLabel={t('wallet.account_name_label')}
          />

          <View style={modalStyles.footer}>
            <TouchableOpacity style={[modalStyles.btn, modalStyles.cancelBtn]} onPress={onClose}>
              <Text variant="body" weight="semibold" color="primary">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.btn, modalStyles.addBtn, (!number.trim() || !name.trim()) && modalStyles.disabled]}
              onPress={handleAdd}
              disabled={!number.trim() || !name.trim()}
            >
              <Text variant="body" weight="semibold" color="inverse">{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
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
  typePicker: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
  },
  typeList: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.md,
    overflow: 'hidden',
    marginTop: 2,
  },
  typeOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  footer: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  btn: { flex: 1, height: 48, borderRadius: theme.layout.radius.lg, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 1.5, borderColor: theme.colors.primary },
  addBtn: { backgroundColor: theme.colors.primary },
  disabled: { opacity: 0.5 },
});

// ─── Withdraw modal ───────────────────────────────────────────────────────────

function WithdrawModal({
  visible,
  balancePaisa,
  hasMfsAccount,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  balancePaisa: number;
  hasMfsAccount: boolean;
  onClose: () => void;
  onSubmit: (amountPaisa: number) => void;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!hasMfsAccount) { setError(t('wallet.withdraw_no_account')); return; }
    const taka = parseFloat(input);
    if (isNaN(taka) || taka < 100) { setError(t('wallet.withdraw_min')); return; }
    if (taka * 100 > balancePaisa) { setError(t('wallet.withdraw_insufficient')); return; }
    setError('');
    onSubmit(Math.round(taka * 100));
    setInput('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text variant="h4" weight="bold" style={modalStyles.title}>{t('wallet.withdraw_title')}</Text>
          <Text variant="caption" color="muted" style={modalStyles.label}>{t('wallet.withdraw_amount_label')}</Text>
          <TextInput
            style={[modalStyles.input, error ? { borderColor: theme.colors.error } : null]}
            placeholder={t('wallet.withdraw_amount_placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={input}
            onChangeText={(v) => { setInput(v); setError(''); }}
            keyboardType="decimal-pad"
            accessibilityLabel={t('wallet.withdraw_amount_label')}
          />
          {error ? <Text variant="caption" style={{ color: theme.colors.error }}>{error}</Text> : null}
          <View style={modalStyles.footer}>
            <TouchableOpacity style={[modalStyles.btn, modalStyles.cancelBtn]} onPress={onClose}>
              <Text variant="body" weight="semibold" color="primary">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.btn, modalStyles.addBtn]} onPress={handleSubmit}>
              <Text variant="body" weight="semibold" color="inverse">{t('wallet.withdraw_submit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showWithdraw, setShowWithdraw]     = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['wallet'],
    queryFn: paymentService.getWallet,
  });

  const { data: accounts = [], refetch: refetchAccounts } = useQuery({
    queryKey: ['mfsAccounts'],
    queryFn: paymentService.listMfsAccounts,
  });

  const { mutate: requestWithdrawal, isPending: withdrawing } = useMutation({
    mutationFn: paymentService.requestWithdrawal,
    onSuccess: () => {
      toast.success(t('wallet.withdraw_success'));
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: () => toast.error(t('wallet.withdraw_error')),
  });

  const { mutate: addAccount } = useMutation({
    mutationFn: paymentService.addMfsAccount,
    onSuccess: () => {
      toast.success(t('wallet.account_add_success'));
      queryClient.invalidateQueries({ queryKey: ['mfsAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['profileCompletion'] });
    },
    onError: () => toast.error(t('wallet.account_add_error')),
  });

  const { mutate: setPrimary } = useMutation({
    mutationFn: paymentService.setPrimaryMfsAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mfsAccounts'] }),
  });

  const { mutate: removeAccount } = useMutation({
    mutationFn: paymentService.deleteMfsAccount,
    onSuccess: () => {
      toast.success(t('wallet.account_remove_success'));
      queryClient.invalidateQueries({ queryKey: ['mfsAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['profileCompletion'] });
    },
    onError: () => toast.error(t('wallet.account_remove_error')),
  });

  const handleRemoveAccount = (id: string) => {
    Alert.alert(t('wallet.remove_account'), t('wallet.remove_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('wallet.remove_account'), style: 'destructive', onPress: () => removeAccount(id) },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title={t('wallet.title')} />
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title={t('wallet.title')} />
        <View style={styles.errorWrap}>
          <Text variant="body" color="muted" align="center">{t('wallet.load_error')}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text variant="body" color="primary">{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { wallet, transactions } = data;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={t('wallet.title')} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetch(); refetchAccounts(); }}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Balance */}
        <BalanceCard
          balancePaisa={wallet.balance_paisa}
          totalEarnedPaisa={wallet.total_earned_paisa}
          totalWithdrawnPaisa={wallet.total_withdrawn_paisa}
          onWithdraw={() => !withdrawing && setShowWithdraw(true)}
        />

        {/* Commission info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Info color={theme.colors.primary} size={16} />
            <Text variant="caption" color="muted" style={styles.flex}>{t('wallet.commission_info')}</Text>
          </View>
        </Card>

        {/* Payout accounts */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="body" weight="semibold" style={styles.flex}>{t('wallet.accounts_title')}</Text>
            <TouchableOpacity
              onPress={() => setShowAddAccount(true)}
              style={styles.addBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('wallet.add_account')}
            >
              <Plus color={theme.colors.primary} size={18} />
              <Text variant="caption" color="primary" weight="medium">{t('wallet.add_account')}</Text>
            </TouchableOpacity>
          </View>
          {accounts.length === 0 ? (
            <Text variant="caption" color="muted" style={styles.emptyText}>{t('wallet.withdraw_no_account')}</Text>
          ) : (
            accounts.map((acct, idx) => (
              <View key={acct.id}>
                {idx > 0 && <View style={styles.divider} />}
                <AccountItem
                  account={acct}
                  onSetPrimary={setPrimary}
                  onRemove={handleRemoveAccount}
                />
              </View>
            ))
          )}
        </Card>

        {/* Transactions */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <ArrowDownCircle color={theme.colors.primary} size={16} />
            <Text variant="body" weight="semibold">{t('wallet.transactions')}</Text>
          </View>
          {transactions.length === 0 ? (
            <Text variant="caption" color="muted" style={styles.emptyText}>{t('wallet.no_transactions')}</Text>
          ) : (
            transactions.map((tx, idx) => (
              <View key={tx.id}>
                {idx > 0 && <View style={styles.divider} />}
                <TxItem tx={tx} />
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <WithdrawModal
        visible={showWithdraw}
        balancePaisa={wallet.balance_paisa}
        hasMfsAccount={accounts.length > 0}
        onClose={() => setShowWithdraw(false)}
        onSubmit={requestWithdrawal}
      />

      <AddAccountModal
        visible={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onAdd={addAccount}
      />
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
  section: { padding: theme.spacing.md, gap: theme.spacing.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.xs },
  flex: { flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  emptyText: { paddingVertical: theme.spacing.sm },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 2 },
  infoCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
});
