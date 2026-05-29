import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Star, Wallet, ToggleLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { providerService } from '@/services/provider.service';
import { theme } from '@/theme';

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text variant="h4" weight="bold" style={styles.statValue}>{value}</Text>
      <Text variant="caption" color="muted">{label}</Text>
    </Card>
  );
}

export default function ProviderHomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['provider', 'me'],
    queryFn: () => providerService.getProfile(user!.id),
    enabled: !!user?.id,
  });

  const [available, setAvailable] = useState<boolean | null>(null);
  const isAvailable = available ?? profile?.is_available ?? false;

  const { mutate: toggleAvailability, isPending } = useMutation({
    mutationFn: (val: boolean) =>
      providerService.updateMyAvailability(val),
    onSuccess: (_, val) => {
      setAvailable(val);
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] });
    },
    onError: () => {
      Alert.alert(t('common.error'), t('provider_home.toggle_error'));
    },
  });

  const rating = parseFloat(profile?.rating_avg ?? '0').toFixed(1);
  const earnings = profile?.hourly_rate
    ? `৳${parseFloat(String(profile.hourly_rate)).toFixed(0)}/${t('category.hr')}`
    : '—';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h3" weight="bold">
            {t('nav.greeting', { name: user?.fullName || t('nav.there') })}
          </Text>
          <Text variant="body" color="muted" style={styles.headerSub}>
            {t('provider_home.subtitle')}
          </Text>
        </View>

        {/* Availability toggle */}
        <Card style={styles.availabilityCard}>
          <View style={styles.availabilityRow}>
            <View style={styles.availabilityLeft}>
              <ToggleLeft
                color={isAvailable ? theme.colors.success : theme.colors.textMuted}
                size={22}
              />
              <View style={styles.availabilityText}>
                <Text variant="body" weight="semibold">
                  {t('provider_home.availability')}
                </Text>
                <Text variant="caption" color="muted">
                  {isAvailable ? t('provider_home.you_are_visible') : t('provider_home.you_are_hidden')}
                </Text>
              </View>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={(val) => toggleAvailability(val)}
              disabled={isPending || isLoading}
              trackColor={{ false: theme.colors.border, true: theme.colors.success }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </Card>

        {/* Stats */}
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Briefcase color={theme.colors.primary} size={24} />}
              label={t('provider_home.active_jobs')}
              value="0"
            />
            <StatCard
              icon={<Star color={theme.colors.secondary} size={24} fill={theme.colors.secondary} />}
              label={t('provider_home.rating')}
              value={rating}
            />
            <StatCard
              icon={<Wallet color={theme.colors.success} size={24} />}
              label={t('provider_home.my_rate')}
              value={earnings}
            />
          </View>
        )}

        {/* Active jobs placeholder */}
        <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
          {t('provider_home.active_jobs_section')}
        </Text>
        <Card style={styles.placeholderCard}>
          <Text variant="body" color="muted" align="center">
            {t('provider_home.jobs_coming')}
          </Text>
          <Text variant="caption" color="muted" align="center" style={styles.ticketRef}>
            HF-038
          </Text>
        </Card>

        {/* Earnings placeholder */}
        <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
          {t('provider_home.earnings_section')}
        </Text>
        <Card style={styles.placeholderCard}>
          <Text variant="body" color="muted" align="center">
            {t('provider_home.earnings_coming')}
          </Text>
          <Text variant="caption" color="muted" align="center" style={styles.ticketRef}>
            HF-060
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl },
  header: { marginTop: theme.spacing.md, marginBottom: theme.spacing.md },
  headerSub: { marginTop: theme.spacing.xs },
  availabilityCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  availabilityText: { gap: 2 },
  loader: { marginVertical: theme.spacing.xl },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 4,
  },
  statIcon: { marginBottom: 4 },
  statValue: { textAlign: 'center' },
  sectionTitle: { marginBottom: theme.spacing.sm, marginTop: theme.spacing.xs },
  placeholderCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  ticketRef: { marginTop: theme.spacing.xs },
});
