import React, { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, ChevronDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { providerService, type AvailableProvider } from '@/services/provider.service';
import { theme } from '@/theme';

type SortKey = 'rating' | 'experience' | 'rate';

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: 'rating', labelKey: 'category.sort_rating' },
  { key: 'experience', labelKey: 'category.sort_experience' },
  { key: 'rate', labelKey: 'category.sort_rate' },
];

function sortProviders(providers: AvailableProvider[], sort: SortKey): AvailableProvider[] {
  return [...providers].sort((a, b) => {
    if (sort === 'rating') {
      return parseFloat(b.rating_avg ?? '0') - parseFloat(a.rating_avg ?? '0');
    }
    if (sort === 'experience') {
      return (b.experience_years ?? 0) - (a.experience_years ?? 0);
    }
    if (sort === 'rate') {
      const rateA = parseFloat(String(a.hourly_rate ?? 0));
      const rateB = parseFloat(String(b.hourly_rate ?? 0));
      return rateA - rateB;
    }
    return 0;
  });
}

function ProviderListItem({ item, onPress }: { item: AvailableProvider; onPress: () => void }) {
  const { t } = useTranslation();
  const name = item.user?.full_name ?? t('home.unknown_provider');
  const rating = parseFloat(item.rating_avg ?? '0').toFixed(1);
  const rate = item.hourly_rate
    ? `৳${parseFloat(String(item.hourly_rate)).toFixed(0)}/${t('category.hr')}`
    : t('category.rate_negotiable');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <Card style={styles.providerItem}>
        <View style={styles.providerRow}>
          <View style={styles.avatar}>
            <Text variant="h3" weight="bold" color="inverse">
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.providerDetails}>
            <Text variant="body" weight="semibold">{name}</Text>
            <View style={styles.metaRow}>
              <Star color={theme.colors.secondary} size={13} fill={theme.colors.secondary} />
              <Text variant="caption" color="muted" style={styles.metaText}>
                {rating} · {item.experience_years}yr exp
              </Text>
            </View>
            <Text variant="caption" color="primary" weight="medium">{rate}</Text>
          </View>

          <View style={styles.reviewBadge}>
            <Text variant="caption" color="muted">{item.total_reviews} {t('category.reviews')}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function CategoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: categoryId, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [sort, setSort] = useState<SortKey>('rating');

  const { data: allProviders = [], isLoading } = useQuery({
    queryKey: ['providers', 'available'],
    queryFn: providerService.listAvailable,
  });

  const providers = useMemo(() => {
    const inCategory = allProviders.filter((p) =>
      p.skills.some((s) => s.category_id === categoryId)
    );
    return sortProviders(inCategory, sort);
  }, [allProviders, categoryId, sort]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" style={styles.headerTitle} numberOfLines={1}>
          {name ?? t('category.providers')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Sort bar */}
      <View style={styles.sortBar}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortChip, sort === opt.key && styles.sortChipActive]}
            onPress={() => setSort(opt.key)}
            accessibilityRole="button"
            accessibilityLabel={t(opt.labelKey)}
            accessibilityState={{ selected: sort === opt.key }}
          >
            <Text
              variant="caption"
              weight={sort === opt.key ? 'semibold' : 'regular'}
              color={sort === opt.key ? 'inverse' : 'muted'}
            >
              {t(opt.labelKey)}
            </Text>
            {sort === opt.key && <ChevronDown color={theme.colors.textInverse} size={12} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="body" color="muted" align="center">
                {t('category.no_providers')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProviderListItem
              item={item}
              onPress={() =>
                router.push({ pathname: '/(app)/provider/[id]', params: { id: item.user_id } })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  sortBar: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  list: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  providerItem: {
    padding: theme.spacing.md,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerDetails: {
    flex: 1,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    marginTop: 1,
  },
  reviewBadge: {
    alignItems: 'flex-end',
  },
  empty: {
    paddingTop: theme.spacing['2xl'],
  },
});
