import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { paymentService } from '@/services/payment.service';
import { theme } from '@/theme';

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ percentage }: { percentage: number }) {
  const pct = Math.min(100, Math.max(0, percentage));
  const color = pct >= 70 ? theme.colors.success : pct >= 40 ? theme.colors.warning : theme.colors.error;

  return (
    <View style={barStyles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View style={[barStyles.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
});

// ─── Full card (for Profile screen) ──────────────────────────────────────────

export function ProfileCompletionCard() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['profileCompletion'],
    queryFn: paymentService.getProfileCompletion,
    staleTime: 60_000,
  });

  if (isLoading || !data) return null;
  if (data.percentage >= 100) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <AlertCircle
          color={data.meets_threshold ? theme.colors.success : theme.colors.warning}
          size={18}
        />
        <Text variant="body" weight="semibold" style={styles.flex}>
          {t('profile.completion.title', { percentage: data.percentage })}
        </Text>
        <Text variant="caption" weight="bold" style={styles.pct}>
          {data.percentage}%
        </Text>
      </View>

      <ProgressBar percentage={data.percentage} />

      {data.missing_items.length > 0 && (
        <View style={styles.missingList}>
          <Text variant="caption" color="muted" style={styles.missingHeader}>
            {t('profile.completion.missing_header')}
          </Text>
          {data.missing_items.map((item) => (
            <View key={item.key} style={styles.itemRow}>
              <Circle color={theme.colors.error} size={13} />
              <Text variant="caption" style={styles.itemLabel}>
                {t(item.label_key as Parameters<typeof t>[0])}
              </Text>
            </View>
          ))}
        </View>
      )}

      {data.completed_items.length > 0 && data.missing_items.length > 0 && (
        <View style={styles.missingList}>
          {data.completed_items.map((item) => (
            <View key={item.key} style={styles.itemRow}>
              <CheckCircle2 color={theme.colors.success} size={13} />
              <Text variant="caption" color="muted" style={styles.itemLabel}>
                {t(item.label_key as Parameters<typeof t>[0])}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

// ─── Compact banner (for Provider home screen) ────────────────────────────────

export function ProfileCompletionBanner({ onPress }: { onPress?: () => void }) {
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: ['profileCompletion'],
    queryFn: paymentService.getProfileCompletion,
    staleTime: 60_000,
  });

  if (!data || data.meets_threshold) return null;

  const content = (
    <View style={bannerStyles.wrap}>
      <AlertCircle color={theme.colors.warning} size={18} />
      <View style={bannerStyles.text}>
        <Text variant="caption" weight="semibold">{t('profile.completion.banner_message')}</Text>
        <Text variant="caption" color="muted">
          {t('profile.completion.banner_sub', {
            percentage: data.percentage,
            count: data.missing_items.length,
          })}
        </Text>
      </View>
      <Text variant="caption" color="primary" weight="semibold">
        {t('profile.completion.banner_cta')}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={bannerStyles.card}
        accessibilityRole="button"
        accessibilityLabel={t('profile.completion.banner_message')}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={bannerStyles.card}>{content}</View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: { padding: theme.spacing.md, gap: theme.spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  flex: { flex: 1 },
  pct: { color: theme.colors.primary, fontSize: 18 },
  missingList: { gap: 6, marginTop: 2 },
  missingHeader: { marginBottom: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemLabel: { flex: 1 },
});

const bannerStyles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.warningBackground ?? '#FFF8E1',
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.layout.radius.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  text: { flex: 1, gap: 2 },
});
