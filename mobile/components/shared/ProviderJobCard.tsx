import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Banknote, Calendar, Navigation } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { theme } from '@/theme';
import { Job } from '@/services/job.service';

type Props = {
  job: Job;
  categoryName?: string;
  distanceKm?: number | null;
  onPress: () => void;
};

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function ProviderJobCard({ job, categoryName, distanceKm, onPress }: Props) {
  const { t } = useTranslation();

  const title = job.title ?? categoryName ?? t('home.unknown_provider');
  const addressLine = [job.service_address?.road, job.service_address?.area]
    .filter(Boolean)
    .join(', ');
  const budget = job.estimated_budget
    ? `৳${parseFloat(String(job.estimated_budget)).toFixed(0)}`
    : t('feed.budget_tbd');
  const descPreview =
    job.description.length > 100 ? job.description.slice(0, 100) + '…' : job.description;

  const distanceLabel =
    distanceKm !== null && distanceKm !== undefined
      ? distanceKm < 1
        ? t('feed.distance_near')
        : t('feed.distance_km', { km: distanceKm.toFixed(1) })
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Card style={styles.card}>
        {/* Top row: title + distance badge */}
        <View style={styles.topRow}>
          <View style={styles.titleWrap}>
            <Text variant="body" weight="semibold" numberOfLines={1}>{title}</Text>
            {categoryName && (
              <View style={styles.categoryChip}>
                <Text variant="caption" color="primary" weight="medium">{categoryName}</Text>
              </View>
            )}
          </View>
          {distanceLabel && (
            <View style={styles.distanceBadge}>
              <Navigation color={theme.colors.primary} size={11} />
              <Text variant="caption" weight="semibold" color="primary" style={styles.distanceText}>
                {distanceLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Description preview */}
        <Text variant="caption" color="muted" style={styles.descPreview} numberOfLines={2}>
          {descPreview}
        </Text>

        {/* Meta row */}
        <View style={styles.metaGrid}>
          {addressLine ? (
            <View style={styles.metaItem}>
              <MapPin color={theme.colors.textMuted} size={13} />
              <Text variant="caption" color="muted" style={styles.metaText} numberOfLines={1}>
                {addressLine}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Banknote color={theme.colors.textMuted} size={13} />
            <Text variant="caption" color="muted" style={styles.metaText}>{budget}</Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar color={theme.colors.textMuted} size={13} />
            <Text variant="caption" color="muted" style={styles.metaText}>
              {formatDate(job.created_at)}
            </Text>
          </View>
        </View>

        {/* CTA — plain View to avoid nested-TouchableOpacity clipping on Android */}
        <View style={styles.cta}>
          <Text variant="body" weight="semibold" color="primary" align="center">
            {t('feed.view_job')}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.layout.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.raw.primaryLight + '22',
    flexShrink: 0,
  },
  distanceText: {
    marginLeft: 2,
  },
  descPreview: {
    lineHeight: 18,
  },
  metaGrid: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    flex: 1,
  },
  cta: {
    marginTop: theme.spacing.xs,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
  },
});
