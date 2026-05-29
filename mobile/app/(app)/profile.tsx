import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  ChevronRight,
  LogOut,
  Camera,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/theme';

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoContent}>
        <Text variant="caption" color="muted">{label}</Text>
        <Text variant="body" weight="medium">{value || '—'}</Text>
      </View>
      {onPress && <ChevronRight color={theme.colors.textMuted} size={18} />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout_confirm_title'),
      t('profile.logout_confirm_desc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handlePhotoUpload = () => {
    Alert.alert(t('profile.photo_upload'), t('profile.photo_coming'));
  };

  const handleLocationUpdate = () => {
    Alert.alert(t('profile.location_update'), t('profile.location_coming'));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text variant="h1" weight="bold" color="inverse">
                {(user?.fullName?.charAt(0) ?? 'U').toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.cameraBtn} onPress={handlePhotoUpload} hitSlop={4}>
              <Camera color={theme.colors.textInverse} size={16} />
            </TouchableOpacity>
          </View>
          <Text variant="h4" weight="bold" style={styles.userName}>
            {user?.fullName || '—'}
          </Text>
          <Text variant="caption" color="muted">{t(`auth.${user?.role}`)}</Text>
        </View>

        {/* Personal info */}
        <Card style={styles.section}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            {t('profile.personal_info')}
          </Text>
          <InfoRow
            icon={<User color={theme.colors.primary} size={18} />}
            label={t('auth.full_name')}
            value={user?.fullName ?? ''}
            onPress={() => Alert.alert(t('profile.edit'), t('profile.edit_coming'))}
          />
          <View style={styles.divider} />
          <InfoRow
            icon={<Phone color={theme.colors.primary} size={18} />}
            label={t('auth.mobile')}
            value={user?.mobile ?? ''}
          />
          {user?.email ? (
            <>
              <View style={styles.divider} />
              <InfoRow
                icon={<Mail color={theme.colors.primary} size={18} />}
                label={t('auth.email')}
                value={user.email}
              />
            </>
          ) : null}
          <View style={styles.divider} />
          <InfoRow
            icon={<MapPin color={theme.colors.primary} size={18} />}
            label={t('auth.location')}
            value={t('profile.tap_to_update')}
            onPress={handleLocationUpdate}
          />
        </Card>

        {/* Preferences */}
        <Card style={styles.section}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            {t('profile.preferences')}
          </Text>

          <View style={styles.preferenceRow}>
            <View style={styles.prefLeft}>
              <Globe color={theme.colors.primary} size={18} />
              <Text variant="body" style={styles.prefLabel}>{t('profile.language')}</Text>
            </View>
            <LanguageToggle />
          </View>

          <View style={styles.divider} />

          <View style={styles.preferenceRow}>
            <View style={styles.prefLeft}>
              <User color={theme.colors.primary} size={18} />
              <Text variant="body" style={styles.prefLabel}>{t('profile.dark_mode')}</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          label={t('auth.logout')}
          leftIcon={<LogOut color={theme.colors.primary} size={18} />}
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  avatarWrap: { position: 'relative', marginBottom: theme.spacing.sm },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: theme.layout.radius.full,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  userName: { marginBottom: 2 },
  section: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: { marginBottom: theme.spacing.md },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.layout.radius.md,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: { flex: 1, gap: 2 },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 2,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  prefLabel: { marginLeft: 2 },
  logoutButton: { marginTop: theme.spacing.sm },
});
