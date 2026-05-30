import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { theme } from '@/theme';
import { UserRole } from '@homefix/shared';
import { User, Briefcase, ChevronRight, ArrowLeft } from 'lucide-react-native';

import { useTranslation } from 'react-i18next';

export default function SelectRoleScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSelect = (role: UserRole) => {
    router.push({
      pathname: '/(auth)/register',
      params: { role },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={8}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text variant="h1" weight="bold" style={styles.title}>
          {t('auth.select_role_title')}
        </Text>
        <Text variant="body" color="muted" style={styles.subtitle}>
          {t('auth.select_role_subtitle')}
        </Text>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleSelect(UserRole.RESIDENT)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('auth.resident')}
          accessibilityHint={t('auth.resident_desc')}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '15' }]}>
            <User size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.roleInfo}>
            <Text variant="h3" weight="bold">{t('auth.resident')}</Text>
            <Text variant="caption" color="muted">{t('auth.resident_desc')}</Text>
          </View>
          <ChevronRight size={20} color={theme.colors.border} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleSelect(UserRole.PROVIDER)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('auth.provider')}
          accessibilityHint={t('auth.provider_desc')}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.colors.secondary + '15' }]}>
            <Briefcase size={32} color={theme.colors.secondary} />
          </View>
          <View style={styles.roleInfo}>
            <Text variant="h3" weight="bold">{t('auth.provider')}</Text>
            <Text variant="caption" color="muted">{t('auth.provider_desc')}</Text>
          </View>
          <ChevronRight size={20} color={theme.colors.border} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text variant="body" color="muted">{t('auth.already_account')} </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          accessibilityRole="link"
          accessibilityLabel={t('auth.sign_in')}
        >
          <Text variant="body" color="primary" weight="bold">{t('auth.sign_in')}</Text>
        </TouchableOpacity>
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
    padding: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.xs,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.xxl,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
});
