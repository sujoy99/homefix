import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Receipt, ArrowRight } from 'lucide-react-native';
import { PaymentMethod } from '@homefix/shared';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { theme } from '@/theme';

const METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.BKASH]: 'payment.method_bkash',
  [PaymentMethod.NAGAD]: 'payment.method_nagad',
  [PaymentMethod.CARD]: 'payment.method_card',
  [PaymentMethod.BANK_TRANSFER]: 'payment.method_bank_transfer',
  [PaymentMethod.CASH]: 'payment.method_cash',
};

export default function PaymentReceiptScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { paymentId, method, amountPaisa } = useLocalSearchParams<{
    paymentId: string;
    method: string;
    amountPaisa: string;
    jobId: string;
  }>();

  const amountTaka = amountPaisa ? (parseInt(amountPaisa, 10) / 100).toFixed(0) : '—';
  const methodLabel = method ? t(METHOD_LABELS[method] ?? 'payment.method_cash') : '—';
  const shortId = paymentId ? paymentId.slice(0, 8).toUpperCase() : '—';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Success icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <CheckCircle2 color={theme.colors.success} size={56} />
          </View>
          <Text variant="h3" weight="bold" style={styles.successTitle}>
            {t('payment.success_title')}
          </Text>
          <Text variant="body" color="muted" align="center" style={styles.successDesc}>
            {t('payment.success_desc')}
          </Text>
        </View>

        {/* Receipt card */}
        <Card style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Receipt color={theme.colors.primary} size={18} />
            <Text variant="body" weight="semibold">{t('receipt.title')}</Text>
          </View>

          <ReceiptRow label={t('receipt.payment_id')} value={shortId} />
          <ReceiptRow label={t('receipt.method')} value={methodLabel} />
          <ReceiptRow label={t('receipt.amount')} value={`৳${amountTaka}`} />
          <ReceiptRow
            label={t('receipt.status')}
            value={t('receipt.status_submitted')}
            valueColor={theme.colors.warning}
          />
        </Card>

        {/* What happens next */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <ArrowRight color={theme.colors.primary} size={16} />
            <View style={styles.infoContent}>
              <Text variant="body" weight="semibold">{t('receipt.what_next')}</Text>
              <Text variant="caption" color="muted" style={styles.infoDesc}>
                {t('receipt.what_next_desc')}
              </Text>
            </View>
          </View>
        </Card>

      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          label={t('receipt.done_cta')}
          variant="primary"
          onPress={() => router.replace('/(app)/(tabs)/bookings')}
        />
      </View>
    </SafeAreaView>
  );
}

function ReceiptRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={receiptStyles.row}>
      <Text variant="body" color="muted">{label}</Text>
      <Text
        variant="body"
        weight="medium"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 100,
    gap: theme.spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.successBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  successTitle: { textAlign: 'center' },
  successDesc: { maxWidth: 280 },
  receiptCard: { padding: theme.spacing.md, gap: theme.spacing.sm },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  infoRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
  infoContent: { flex: 1, gap: 4 },
  infoDesc: { lineHeight: 20 },
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
  },
});

const receiptStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
});
