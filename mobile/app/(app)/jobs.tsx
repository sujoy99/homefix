import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Briefcase } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { theme } from '@/theme';

/**
 * Provider-only Jobs tab — placeholder shell.
 * Full screen: HF-038
 */
export default function JobsScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h2" weight="bold">{t('nav.jobs')}</Text>
      </View>

      <View style={styles.placeholder}>
        <Briefcase color={theme.colors.primary} size={48} />
        <Text variant="h4" weight="semibold" style={styles.placeholderTitle}>
          {t('nav.jobs_coming')}
        </Text>
        <Text variant="body" color="muted" style={styles.placeholderDesc}>
          HF-038
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.lg,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
