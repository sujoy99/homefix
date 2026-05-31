import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Building2,
  Coins,
} from 'lucide-react-native';
import { PaymentMethod, REQUIRES_TRANSACTION_ID, JobStatus } from '@homefix/shared';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { jobService } from '@/services/job.service';
import { categoryService } from '@/services/category.service';
import { paymentService } from '@/services/payment.service';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

// ─── Method config ────────────────────────────────────────────────────────────

type MethodConfig = {
  method: PaymentMethod;
  labelKey: string;
  icon: React.ReactNode;
  color: string;
};

const METHOD_CONFIGS: MethodConfig[] = [
  {
    method: PaymentMethod.BKASH,
    labelKey: 'payment.method_bkash',
    icon: <Smartphone size={22} />,
    color: '#E2136E',
  },
  {
    method: PaymentMethod.NAGAD,
    labelKey: 'payment.method_nagad',
    icon: <Smartphone size={22} />,
    color: '#F7941D',
  },
  {
    method: PaymentMethod.CARD,
    labelKey: 'payment.method_card',
    icon: <CreditCard size={22} />,
    color: theme.colors.primary,
  },
  {
    method: PaymentMethod.BANK_TRANSFER,
    labelKey: 'payment.method_bank_transfer',
    icon: <Building2 size={22} />,
    color: theme.colors.secondary,
  },
  {
    method: PaymentMethod.CASH,
    labelKey: 'payment.method_cash',
    icon: <Coins size={22} />,
    color: theme.colors.success,
  },
];

const TXID_REGEX = /^[a-zA-Z0-9]{8,20}$/;

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [txid, setTxid] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txidError, setTxidError] = useState('');
  const [amountError, setAmountError] = useState('');

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.getJobById(jobId),
    enabled: !!jobId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.listActive,
  });

  const categoryName = categories.find((c) => c.id === job?.category_id)?.name;

  const requiresTxid = selectedMethod ? REQUIRES_TRANSACTION_ID.has(selectedMethod) : false;

  const budgetTaka = job?.estimated_budget
    ? parseFloat(String(job.estimated_budget))
    : null;

  const validate = (): boolean => {
    let valid = true;
    if (requiresTxid) {
      if (!txid.trim()) {
        setTxidError(t('payment.txid_required'));
        valid = false;
      } else if (!TXID_REGEX.test(txid.trim())) {
        setTxidError(t('payment.txid_invalid'));
        valid = false;
      } else {
        setTxidError('');
      }
    } else {
      setTxidError('');
    }

    if (!amountInput.trim()) {
      setAmountError(t('payment.amount_required'));
      valid = false;
    } else {
      const parsed = parseFloat(amountInput);
      if (isNaN(parsed) || parsed <= 0) {
        setAmountError(t('payment.amount_invalid'));
        valid = false;
      } else {
        setAmountError('');
      }
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!selectedMethod || !job) return;
    if (!validate()) return;

    const amountPaisa = Math.round(parseFloat(amountInput) * 100);

    setIsSubmitting(true);
    try {
      const payment = await paymentService.submitPayment({
        job_id: job.id,
        method: selectedMethod,
        transaction_id: requiresTxid ? txid.trim() : undefined,
        amount_paisa: amountPaisa,
      });
      router.replace({
        pathname: '/(app)/payment/receipt',
        params: {
          paymentId: payment.id,
          method: payment.method,
          amountPaisa: String(payment.amount_paisa),
          jobId: job.id,
        },
      });
    } catch (err) {
      const errorCode = (err as { response?: { data?: { error_code?: string } } })
        ?.response?.data?.error_code;
      if (errorCode === 'ALREADY_EXISTS') {
        toast.error(t('payment.already_submitted'));
      } else {
        toast.error(t('payment.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Prefill amount from budget ─────────────────────────────────────────────
  React.useEffect(() => {
    if (budgetTaka && !amountInput) {
      setAmountInput(budgetTaka.toFixed(0));
    }
  }, [budgetTaka]);

  if (jobLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onBack={() => router.back()} title={t('payment.title')} />
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!job || job.status !== JobStatus.AWAITING_PAYMENT) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onBack={() => router.back()} title={t('payment.title')} />
        <View style={styles.errorWrap}>
          <Text variant="body" color="muted" align="center">{t('job_detail.load_error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onBack={() => router.back()} title={t('payment.title')} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order summary */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Banknote color={theme.colors.primary} size={16} />
              <Text variant="body" weight="semibold">{t('payment.order_summary')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="body" color="muted">{t('payment.service')}</Text>
              <Text variant="body" weight="medium">{categoryName ?? '—'}</Text>
            </View>
            {budgetTaka && (
              <View style={styles.summaryRow}>
                <Text variant="body" color="muted">{t('payment.budget')}</Text>
                <Text variant="body" weight="medium">৳{budgetTaka.toFixed(0)}</Text>
              </View>
            )}
          </Card>

          {/* Method selection */}
          <Card style={styles.section}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              {t('payment.select_method')}
            </Text>
            <View style={styles.methodGrid}>
              {METHOD_CONFIGS.map((cfg) => {
                const selected = selectedMethod === cfg.method;
                return (
                  <TouchableOpacity
                    key={cfg.method}
                    style={[
                      styles.methodCard,
                      selected && { borderColor: cfg.color, backgroundColor: cfg.color + '15' },
                    ]}
                    onPress={() => {
                      setSelectedMethod(cfg.method);
                      setTxidError('');
                    }}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityLabel={t(cfg.labelKey)}
                    accessibilityState={{ checked: selected }}
                  >
                    <View style={[styles.methodIcon, { backgroundColor: cfg.color + '20' }]}>
                      {React.cloneElement(cfg.icon as React.ReactElement, { color: cfg.color })}
                    </View>
                    <Text
                      variant="caption"
                      weight={selected ? 'semibold' : 'regular'}
                      style={selected ? { color: cfg.color } : {}}
                    >
                      {t(cfg.labelKey)}
                    </Text>
                    {selected && (
                      <CheckCircle2
                        color={cfg.color}
                        size={16}
                        style={styles.methodCheck}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Cash note */}
          {selectedMethod === PaymentMethod.CASH && (
            <Card style={[styles.section, styles.cashNote]}>
              <Text variant="caption" color="muted">{t('payment.cash_note')}</Text>
            </Card>
          )}

          {/* TxID input */}
          {requiresTxid && (
            <Card style={styles.section}>
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                {t('payment.txid_label')}
              </Text>
              <TextInput
                style={[styles.input, txidError ? styles.inputError : null]}
                placeholder={t('payment.txid_placeholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={txid}
                onChangeText={(v) => { setTxid(v); setTxidError(''); }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
                accessibilityLabel={t('payment.txid_label')}
              />
              {txidError ? (
                <Text variant="caption" style={styles.fieldError}>{txidError}</Text>
              ) : (
                <Text variant="caption" color="muted">{t('payment.txid_hint')}</Text>
              )}
            </Card>
          )}

          {/* Amount input */}
          <Card style={styles.section}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              {t('payment.amount_label')}
            </Text>
            <TextInput
              style={[styles.input, amountError ? styles.inputError : null]}
              placeholder={t('payment.amount_placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={amountInput}
              onChangeText={(v) => { setAmountInput(v); setAmountError(''); }}
              keyboardType="decimal-pad"
              accessibilityLabel={t('payment.amount_label')}
            />
            {amountError ? (
              <Text variant="caption" style={styles.fieldError}>{amountError}</Text>
            ) : null}
          </Card>

          {/* Submit */}
          <View style={styles.submitWrap}>
            <Button
              label={isSubmitting ? t('payment.submitting') : t('payment.submit')}
              variant="primary"
              disabled={!selectedMethod || isSubmitting}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        hitSlop={8}
        accessibilityRole="button"
      >
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
  flex: { flex: 1 },
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
  errorWrap: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl },
  scroll: { padding: theme.spacing.md, paddingBottom: 40, gap: theme.spacing.sm },
  section: { padding: theme.spacing.md, gap: theme.spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: { marginBottom: theme.spacing.xs },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  methodCard: {
    width: '30%',
    minWidth: 90,
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.lg,
    padding: theme.spacing.sm,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.layout.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  cashNote: {
    backgroundColor: theme.colors.successBackground,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
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
  inputError: {
    borderColor: theme.colors.error,
  },
  fieldError: {
    color: theme.colors.error,
    marginTop: 2,
  },
  submitWrap: { marginTop: theme.spacing.sm },
});
