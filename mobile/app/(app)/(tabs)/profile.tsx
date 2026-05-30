import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
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
  Check,
  Pencil,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useAuthStore } from '@/store/authStore';
import { categoryService } from '@/services/category.service';
import { providerService } from '@/services/provider.service';
import { UserRole } from '@homefix/shared';
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
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
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
  const queryClient = useQueryClient();

  const isProvider = user?.role === UserRole.PROVIDER;

  const { data: myProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['provider', 'me'],
    queryFn: () => providerService.getMyProfile(),
    enabled: isProvider,
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.listActive,
    enabled: isProvider,
  });

  const { mutate: removeSkill, isPending: removingSkill } = useMutation({
    mutationFn: (skillId: string) => providerService.removeSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['providers', 'available'] });
    },
    onError: () => Alert.alert(t('common.error'), t('profile.skill_remove_error')),
  });

  const { mutate: addSkill, isPending: addingSkill } = useMutation({
    mutationFn: (categoryId: string) => providerService.addSkill(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['providers', 'available'] });
    },
    onError: () => Alert.alert(t('common.error'), t('profile.skill_add_error')),
  });

  const mySkills = myProfile?.skills ?? [];
  const skillsBusy = addingSkill || removingSkill;

  // Multi-select modal state
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  const openServicePicker = useCallback(() => {
    setTempSelected(mySkills.map((s) => s.category_id));
    setShowServicePicker(true);
  }, [mySkills]);

  const toggleTemp = (categoryId: string) => {
    setTempSelected((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const confirmSelection = () => {
    if (tempSelected.length === 0) {
      Alert.alert(t('common.error'), t('profile.skills_min'));
      return;
    }
    const currentIds = new Set(mySkills.map((s) => s.category_id));
    const newIds = new Set(tempSelected);

    mySkills
      .filter((s) => !newIds.has(s.category_id))
      .forEach((s) => removeSkill(s.id));

    tempSelected
      .filter((id) => !currentIds.has(id))
      .forEach((id) => addSkill(id));

    setShowServicePicker(false);
  };

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
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handlePhotoUpload}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('profile.photo_upload')}
            >
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

        {/* My Services — provider only */}
        {isProvider && (
          <>
            <Card style={styles.section}>
              <View style={styles.serviceHeader}>
                <Text variant="h4" weight="semibold">{t('profile.my_services')}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={openServicePicker}
                  disabled={loadingProfile || skillsBusy}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.edit')}
                  accessibilityState={{ disabled: loadingProfile || skillsBusy }}
                >
                  <Pencil color={theme.colors.primary} size={16} />
                  <Text variant="caption" color="primary" weight="medium" style={styles.editBtnLabel}>
                    {t('common.edit')}
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingProfile ? (
                <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 8 }} />
              ) : mySkills.length === 0 ? (
                <TouchableOpacity
                  onPress={openServicePicker}
                  style={styles.noServicesBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.no_services_tap')}
                >
                  <Text variant="caption" color="muted">{t('profile.no_services_tap')}</Text>
                </TouchableOpacity>
              ) : (
                mySkills.map((skill, idx) => {
                  const cat = allCategories.find((c) => c.id === skill.category_id);
                  const label = i18n.language === 'bn' && cat?.name_bn ? cat.name_bn : (cat?.name ?? '');
                  return (
                    <View key={skill.id}>
                      {idx > 0 && <View style={styles.divider} />}
                      <View style={styles.serviceRow}>
                        <Text variant="body" weight={skill.is_primary ? 'semibold' : 'regular'}>
                          {label}
                        </Text>
                        {skill.is_primary && (
                          <View style={styles.primaryBadge}>
                            <Text variant="caption" color="inverse" weight="semibold">
                              {t('profile.primary')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </Card>

            {/* Multi-select picker modal */}
            <Modal
              visible={showServicePicker}
              animationType="slide"
              transparent
              onRequestClose={() => setShowServicePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>
                  <View style={styles.modalHeader}>
                    <Text variant="h4" weight="bold">{t('profile.select_services')}</Text>
                    <Text variant="caption" color="muted">{t('profile.select_services_hint')}</Text>
                  </View>

                  <FlatList
                    data={allCategories}
                    keyExtractor={(c) => c.id}
                    style={styles.modalList}
                    renderItem={({ item: cat }) => {
                      const selected = tempSelected.includes(cat.id);
                      const label = i18n.language === 'bn' && cat.name_bn ? cat.name_bn : cat.name;
                      return (
                        <TouchableOpacity
                          style={styles.modalRow}
                          onPress={() => toggleTemp(cat.id)}
                          activeOpacity={0.7}
                          accessibilityRole="checkbox"
                          accessibilityLabel={label}
                          accessibilityState={{ checked: selected }}
                        >
                          <Text variant="body" style={styles.modalRowLabel}>{label}</Text>
                          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                            {selected && <Check color={theme.colors.textInverse} size={14} />}
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    ItemSeparatorComponent={() => <View style={styles.divider} />}
                  />

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.cancelBtn]}
                      onPress={() => setShowServicePicker(false)}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.cancel')}
                    >
                      <Text variant="body" weight="semibold" color="primary">{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.doneBtn]}
                      onPress={confirmSelection}
                    >
                      <Text variant="body" weight="semibold" color="inverse">{t('common.save')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}

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
        <Card style={[styles.section, styles.logoutCard]}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('auth.logout')}
          >
            <View style={styles.logoutIconWrap}>
              <LogOut color={theme.colors.error} size={18} />
            </View>
            <Text variant="body" weight="semibold" style={styles.logoutText}>
              {t('auth.logout')}
            </Text>
            <ChevronRight color={theme.colors.error} size={18} />
          </TouchableOpacity>
        </Card>
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
  logoutCard: { padding: 0, overflow: 'hidden', marginBottom: theme.spacing.xl },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  logoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.layout.radius.md,
    backgroundColor: theme.colors.errorBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { flex: 1, color: theme.colors.error },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  editBtnLabel: { marginTop: 1 },
  noServicesBtn: {
    paddingVertical: theme.spacing.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  primaryBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.layout.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.layout.radius.xl,
    borderTopRightRadius: theme.layout.radius.xl,
    maxHeight: '75%',
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 4,
  },
  modalList: {
    paddingHorizontal: theme.spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  modalRowLabel: { flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.layout.radius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  doneBtn: {
    backgroundColor: theme.colors.primary,
  },
});
