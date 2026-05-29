import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, DollarSign, Calendar } from 'lucide-react-native';
import { JobStatus } from '@homefix/shared';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { theme } from '@/theme';
import { Job } from '@/services/job.service';

type Props = {
  job: Job;
  categoryName?: string;
  onPress?: () => void;
};

type BadgeConfig = { label: string; bg: string; text: string };

function useStatusBadge(status: JobStatus): BadgeConfig {
  const { t } = useTranslation();
  const map: Record<JobStatus, BadgeConfig> = {
    [JobStatus.PENDING]: {
      label: t('status.pending'),
      bg: theme.colors.warningBackground,
      text: theme.colors.warning,
    },
    [JobStatus.ACTIVE]: {
      label: t('status.active'),
      bg: theme.colors.infoBackground,
      text: theme.colors.info,
    },
    [JobStatus.AWAITING_PAYMENT]: {
      label: t('status.awaitingPayment'),
      bg: theme.colors.raw.primaryLight + '33',
      text: theme.colors.primaryDark,
    },
    [JobStatus.PAID]: {
      label: t('status.paid'),
      bg: theme.colors.successBackground,
      text: theme.colors.success,
    },
    [JobStatus.CANCELLED]: {
      label: t('status.cancelled'),
      bg: theme.colors.raw.gray100,
      text: theme.colors.raw.gray500,
    },
  };
  return map[status] ?? map[JobStatus.PENDING];
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function JobCard({ job, categoryName, onPress }: Props) {
  const { t } = useTranslation();
  const badge = useStatusBadge(job.status);

  const addressLine = [
    job.service_address?.house,
    job.service_address?.road,
    job.service_address?.area,
  ]
    .filter(Boolean)
    .join(', ');

  const title = job.title ?? categoryName ?? job.category_id;
  const budget = job.estimated_budget
    ? `৳${parseFloat(String(job.estimated_budget)).toFixed(0)}`
    : t('bookings.budget_tbd');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <Card style={styles.card}>
        {/* Top row: title + status badge */}
        <View style={styles.topRow}>
          <Text variant="body" weight="semibold" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text variant="caption" weight="semibold" style={{ color: badge.text }}>
              {badge.label}
            </Text>
          </View>
        </View>

        {/* Category chip */}
        {categoryName && (
          <View style={styles.categoryChip}>
            <Text variant="caption" color="primary" weight="medium">{categoryName}</Text>
          </View>
        )}

        {/* Address */}
        {addressLine ? (
          <View style={styles.metaRow}>
            <MapPin color={theme.colors.textMuted} size={13} />
            <Text variant="caption" color="muted" style={styles.metaText} numberOfLines={1}>
              {addressLine}
            </Text>
          </View>
        ) : null}

        {/* Budget + date */}
        <View style={styles.bottomRow}>
          <View style={styles.metaRow}>
            <DollarSign color={theme.colors.textMuted} size={13} />
            <Text variant="caption" color="muted" style={styles.metaText}>{budget}</Text>
          </View>
          <View style={styles.metaRow}>
            <Calendar color={theme.colors.textMuted} size={13} />
            <Text variant="caption" color="muted" style={styles.metaText}>
              {formatDate(job.created_at)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.layout.radius.full,
    flexShrink: 0,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.layout.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
});
