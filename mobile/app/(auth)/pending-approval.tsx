import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { theme } from '@/theme';
import { Clock, CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Clock size={80} color={theme.colors.secondary} />
          <View style={styles.badge}>
            <CheckCircle2 size={24} color={theme.colors.success} fill={theme.colors.surface} />
          </View>
        </View>

        <Text variant="h1" weight="bold" style={styles.title}>
          {t('auth.pending_approval_title')}
        </Text>
        <Text variant="body" color="muted" style={styles.description}>
          {t('auth.pending_approval_desc')}
        </Text>

        <View style={styles.infoBox}>
          <Text variant="caption" weight="bold" color="primary" style={styles.infoTitle}>
            {t('common.next').toUpperCase()}?
          </Text>
          <Text variant="body" style={styles.infoText}>
            • {t('auth.nid_photo')} check{'\n'}
            • {t('auth.profile_photo')} check{'\n'}
            • Skill assessment
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button 
          label={t('auth.sign_in')} 
          variant="outline"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.button}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.xxl,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xxl,
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoTitle: {
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  infoText: {
    lineHeight: 22,
    color: theme.colors.text,
  },
  footer: {
    padding: theme.spacing.xl,
  },
  button: {
    width: '100%',
  },
});
