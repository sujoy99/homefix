import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Star } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { categoryService } from '@/services/category.service';
import { providerService, AvailableProvider } from '@/services/provider.service';
import { theme } from '@/theme';

export default function AllProvidersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers', 'available'],
    queryFn: providerService.listAvailable,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.listActive,
  });

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    let result = providers;
    if (selectedCategory) {
      result = result.filter((p) =>
        p.skills?.some((s) => s.category_id === selectedCategory)
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        (p.user?.full_name ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [providers, selectedCategory, search]);

  const renderProvider = ({ item }: { item: AvailableProvider }) => {
    const name = item.user?.full_name ?? t('home.unknown_provider');
    const rating = parseFloat(item.rating_avg ?? '0').toFixed(1);
    const primarySkill = item.skills?.find((s) => s.is_primary) ?? item.skills?.[0];
    const skillName = primarySkill ? categoryMap.get(primarySkill.category_id) : undefined;

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: '/(app)/provider/[id]', params: { id: item.user_id } })
        }
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={name}
      >
        <Card style={styles.providerCard}>
          <View style={styles.avatar}>
            <Text variant="h3" weight="bold" color="inverse">
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <Text variant="body" weight="semibold" numberOfLines={1}>{name}</Text>
            {skillName && (
              <Text variant="caption" color="primary">{skillName}</Text>
            )}
            <View style={styles.ratingRow}>
              <Star color={theme.colors.secondary} size={13} fill={theme.colors.secondary} />
              <Text variant="caption" color="muted" style={styles.ratingText}>
                {rating} · {item.experience_years} {t('provider.years_exp')}
              </Text>
            </View>
          </View>
          {item.is_available && (
            <View style={styles.availableDot} />
          )}
        </Card>
      </TouchableOpacity>
    );
  };

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
        <Text variant="h4" weight="bold" style={styles.headerTitle}>
          {t('home.near_you')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search color={theme.colors.textMuted} size={16} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('home.search_placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Category filter chips */}
      <FlatList
        data={[{ id: null, name: t('home.categories') }, ...categories] as ({ id: string | null; name: string })[]}
        keyExtractor={(item) => item.id ?? 'all'}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={styles.chipsContent}
        renderItem={({ item }) => {
          const active = item.id === selectedCategory;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedCategory(item.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.id === null ? t('common.all') : item.name}
              accessibilityState={{ selected: active }}
            >
              <Text
                variant="caption"
                weight={active ? 'semibold' : 'regular'}
                style={active ? styles.chipTextActive : styles.chipText}
              >
                {item.id === null ? t('common.all') : item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text variant="body" color="muted" align="center" style={styles.empty}>
              {t('home.no_providers')}
            </Text>
          }
          renderItem={renderProvider}
        />
      )}
    </SafeAreaView>
  );
}

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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchIcon: { marginRight: theme.spacing.sm },
  searchInput: { flex: 1, fontSize: 15, color: theme.colors.text },
  chips: { flexGrow: 0, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  chipsContent: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, gap: theme.spacing.xs },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted },
  chipTextActive: { color: theme.colors.textInverse },
  loader: { marginTop: theme.spacing['2xl'] },
  listContent: { padding: theme.spacing.md, paddingBottom: 32 },
  empty: { marginTop: theme.spacing.xl },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { marginTop: 1 },
  availableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.success,
    flexShrink: 0,
  },
});
