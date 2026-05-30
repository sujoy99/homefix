import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Star,
  Briefcase,
  Clock,
  MessageSquare,
  CheckCircle,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { providerService } from '@/services/provider.service';
import { categoryService } from '@/services/category.service';
import { theme } from '@/theme';

export default function ProviderDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: userId } = useLocalSearchParams<{ id: string }>();

  const { data: provider, isLoading, isError } = useQuery({
    queryKey: ['provider', userId],
    queryFn: () => providerService.getProfile(userId),
    enabled: !!userId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.listActive,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
        </View>
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (isError || !provider) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
        </View>
        <View style={styles.errorWrap}>
          <Text variant="body" color="muted" align="center">{t('provider.load_error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = provider.user?.full_name ?? t('home.unknown_provider');
  const rating = parseFloat(provider.rating_avg ?? '0').toFixed(1);
  const rate = provider.hourly_rate
    ? `৳${parseFloat(String(provider.hourly_rate)).toFixed(0)}/${t('category.hr')}`
    : t('category.rate_negotiable');

  const skillCategories = (provider.skills ?? [])
    .map((s) => categories.find((c) => c.id === s.category_id))
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" style={styles.headerTitle}>
          {t('provider.title')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.avatar}>
              <Text variant="h1" weight="bold" color="inverse">
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.heroInfo}>
              <Text variant="h4" weight="bold">{name}</Text>
              <View style={styles.ratingRow}>
                <Star color={theme.colors.secondary} size={15} fill={theme.colors.secondary} />
                <Text variant="body" weight="semibold" style={styles.ratingText}>{rating}</Text>
                <Text variant="caption" color="muted">({provider.total_reviews} {t('category.reviews')})</Text>
              </View>
              {provider.is_available && (
                <View style={styles.availableBadge}>
                  <CheckCircle color={theme.colors.success} size={13} />
                  <Text variant="caption" color="muted" style={styles.availableText}>
                    {t('provider.available_now')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Briefcase color={theme.colors.primary} size={20} />
            <Text variant="body" weight="bold" style={styles.statValue}>
              {provider.experience_years}
            </Text>
            <Text variant="caption" color="muted">{t('provider.years_exp')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Clock color={theme.colors.primary} size={20} />
            <Text variant="body" weight="bold" style={styles.statValue}>{rate}</Text>
            <Text variant="caption" color="muted">{t('provider.hourly_rate')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MessageSquare color={theme.colors.primary} size={20} />
            <Text variant="body" weight="bold" style={styles.statValue}>
              {provider.total_reviews}
            </Text>
            <Text variant="caption" color="muted">{t('provider.total_reviews')}</Text>
          </View>
        </View>

        {/* Bio */}
        {provider.bio ? (
          <Card style={styles.section}>
            <Text variant="h4" weight="semibold" style={styles.sectionTitle}>{t('provider.about')}</Text>
            <Text variant="body" color="muted">{provider.bio}</Text>
          </Card>
        ) : null}

        {/* Skills */}
        {skillCategories.length > 0 && (
          <Card style={styles.section}>
            <Text variant="h4" weight="semibold" style={styles.sectionTitle}>{t('provider.skills')}</Text>
            <View style={styles.skillChips}>
              {skillCategories.map((cat) => (
                <View key={cat!.id} style={styles.chip}>
                  <Text variant="caption" weight="medium" color="primary">{cat!.name}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Reviews placeholder */}
        <Card style={styles.section}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>{t('provider.reviews')}</Text>
          <Text variant="body" color="muted" align="center" style={styles.reviewsPlaceholder}>
            {t('provider.reviews_coming')}
          </Text>
        </Card>
      </ScrollView>

      {/* Book Now CTA */}
      <View style={styles.footer}>
        <Button
          label={t('provider.book_now')}
          variant="secondary"
          onPress={() => {
            const primarySkill = provider.skills?.find((s) => s.is_primary) ?? provider.skills?.[0];
            const params = primarySkill ? `?categoryId=${primarySkill.category_id}` : '';
            router.push(`/(app)/booking/create${params}` as never);
          }}
        />
      </View>
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
  loader: { marginTop: theme.spacing['2xl'] },
  errorWrap: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl },
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  heroCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: { flex: 1, gap: 4 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: { marginHorizontal: 2 },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  availableText: { marginTop: 1 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.layout.shadow.sm,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { marginTop: 2 },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  section: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: { marginBottom: theme.spacing.sm },
  skillChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  reviewsPlaceholder: { paddingVertical: theme.spacing.md },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
