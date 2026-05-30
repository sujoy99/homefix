import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Wrench,
  Droplets,
  Zap,
  PaintBucket,
  Hammer,
  Sparkles,
  Wind,
  Settings2,
  Leaf,
  Package,
  Bug,
  Star,
  ChevronRight,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { categoryService, type Category } from '@/services/category.service';
import { providerService, type AvailableProvider } from '@/services/provider.service';
import { theme } from '@/theme';

const SLUG_ICON_MAP: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  plumbing: Droplets,
  electrical: Zap,
  painting: PaintBucket,
  carpentry: Hammer,
  cleaning: Sparkles,
  'ac-repair': Wind,
  'air-conditioning': Wind,
  appliance: Settings2,
  gardening: Leaf,
  moving: Package,
  'pest-control': Bug,
};

function categoryIcon(slug: string) {
  return SLUG_ICON_MAP[slug] ?? Wrench;
}

function CategoryCard({ item, onPress }: { item: Category; onPress: () => void }) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const label = isBn && item.name_bn ? item.name_bn : item.name;
  const Icon = categoryIcon(item.slug);

  return (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.categoryIconWrap}>
        <Icon color={theme.colors.primary} size={28} />
      </View>
      <Text variant="caption" weight="medium" align="center" style={styles.categoryLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ProviderCard({ item, onPress }: { item: AvailableProvider; onPress: () => void }) {
  const { t } = useTranslation();
  const name = item.user?.full_name ?? t('home.unknown_provider');
  const rating = parseFloat(item.rating_avg ?? '0').toFixed(1);

  return (
    <TouchableOpacity
      style={styles.providerCard}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <View style={styles.providerAvatar}>
        <Text variant="h3" weight="bold" color="inverse">
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.providerInfo}>
        <Text variant="body" weight="semibold" numberOfLines={1}>{name}</Text>
        <View style={styles.providerRating}>
          <Star color={theme.colors.secondary} size={13} fill={theme.colors.secondary} />
          <Text variant="caption" color="muted" style={styles.ratingText}>
            {rating} · {item.experience_years}yr
          </Text>
        </View>
      </View>
      <ChevronRight color={theme.colors.textMuted} size={18} />
    </TouchableOpacity>
  );
}

export default function ResidentHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.listActive,
  });

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['providers', 'available'],
    queryFn: providerService.listAvailable,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.name_bn?.toLowerCase().includes(q) ?? false)
    );
  }, [search, categories]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="h3" weight="bold">
            {t('nav.greeting', { name: user?.fullName || t('nav.there') })}
          </Text>
          <Text variant="body" color="muted" style={styles.headerSub}>
            {t('home.subtitle')}
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <Search color={theme.colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.search_placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="h4" weight="semibold">{t('home.categories')}</Text>
          {search.length > 0 && (
            <Text variant="caption" color="muted">
              {t('home.results_count', { count: filtered.length })}
            </Text>
          )}
        </View>

        {loadingCats ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <Text variant="body" color="muted" align="center" style={styles.emptyText}>
            {t('home.no_categories')}
          </Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <CategoryCard
                item={item}
                onPress={() =>
                  router.push({ pathname: '/(app)/category/[id]', params: { id: item.id, name: item.name } })
                }
              />
            )}
          />
        )}

        <View style={styles.sectionHeader}>
          <Text variant="h4" weight="semibold">{t('home.near_you')}</Text>
          {providers.length > 3 && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/providers' as never)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('home.see_all', { count: providers.length })}
            >
              <Text variant="caption" color="primary" weight="semibold">
                {t('home.see_all', { count: providers.length })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingProviders ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
        ) : providers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text variant="body" color="muted" align="center">{t('home.no_providers')}</Text>
          </Card>
        ) : (
          <View>
            {providers.slice(0, 3).map((p) => (
              <ProviderCard
                key={p.id}
                item={p}
                onPress={() =>
                  router.push({ pathname: '/(app)/provider/[id]', params: { id: p.user_id } })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl },
  header: { marginTop: theme.spacing.md, marginBottom: theme.spacing.md },
  headerSub: { marginTop: theme.spacing.xs },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    marginBottom: theme.spacing.lg,
  },
  searchIcon: { marginRight: theme.spacing.sm },
  searchInput: { flex: 1, fontSize: 15, color: theme.colors.text },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  loader: { marginVertical: theme.spacing.xl },
  gridRow: { justifyContent: 'flex-start', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  categoryCard: {
    flex: 1,
    maxWidth: '31%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    ...theme.layout.shadow.sm,
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryLabel: { textAlign: 'center' },
  emptyText: { marginVertical: theme.spacing.xl },
  emptyCard: { padding: theme.spacing.lg },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.layout.shadow.sm,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  providerInfo: { flex: 1 },
  providerRating: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  ratingText: { marginTop: 1 },
});
