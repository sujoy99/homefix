import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/theme';

/**
 * Profile tab — available to both residents and providers.
 * Full screen: HF-030
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text variant="h2" weight="bold">{t('nav.profile')}</Text>
      </View>

      <View style={styles.placeholder}>
        <User color={theme.colors.primary} size={48} />
        <Text variant="h4" weight="semibold" style={styles.placeholderTitle}>
          {t('nav.profile_coming')}
        </Text>
        <Text variant="body" color="muted" style={styles.placeholderDesc}>
          HF-030
        </Text>
      </View>

      <View style={styles.userInfo}>
        <Text variant="caption" color="muted">{t('nav.signed_in_as')}</Text>
        <Text variant="body" weight="semibold">{user?.fullName || '—'}</Text>
        <Text variant="caption" color="muted">{user?.mobile}</Text>
      </View>

      <Button
        variant="outline"
        label={t('auth.logout')}
        onPress={() => logout()}
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.lg,
  },
  placeholder: {
    alignItems: 'center',
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
  userInfo: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  logoutButton: {
    marginTop: theme.spacing.sm,
  },
});
