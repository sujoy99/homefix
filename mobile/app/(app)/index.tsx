import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react-native';
import { UserRole } from '@homefix/shared';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/theme';

/**
 * Home tab — placeholder shell.
 * Resident content: HF-026 | Provider content: HF-029
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const isProvider = user?.role === UserRole.PROVIDER;

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text variant="h2" weight="bold">
          {t('nav.greeting', { name: user?.fullName || t('nav.there') })}
        </Text>
        <Text variant="body" color="muted" style={styles.subtitle}>
          {isProvider ? t('nav.provider_home_subtitle') : t('nav.resident_home_subtitle')}
        </Text>
      </View>

      <View style={styles.placeholder}>
        <Home color={theme.colors.primary} size={48} />
        <Text variant="h4" weight="semibold" style={styles.placeholderTitle}>
          {isProvider ? t('nav.provider_home_coming') : t('nav.resident_home_coming')}
        </Text>
        <Text variant="body" color="muted" style={styles.placeholderDesc}>
          {isProvider ? 'HF-029' : 'HF-026'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  placeholderTitle: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  placeholderDesc: {
    textAlign: 'center',
  },
});
