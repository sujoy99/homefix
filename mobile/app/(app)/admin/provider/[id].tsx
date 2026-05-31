import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, User, Phone, Mail, CreditCard, Briefcase,
  FileText, X, CheckCircle, XCircle, ZoomIn,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { adminService } from '@/services/admin.service';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

// ─── Photo card ───────────────────────────────────────────────────────────────

function PhotoCard({ uri, label }: { uri: string | null; label: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  const { t } = useTranslation();

  if (!uri) {
    return (
      <View style={photoStyles.placeholder}>
        <FileText color={theme.colors.textMuted} size={28} />
        <Text variant="caption" color="muted" style={photoStyles.placeholderText}>
          {t('admin_detail.no_photo')}
        </Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={photoStyles.wrap}
        onPress={() => setFullscreen(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Image source={{ uri }} style={photoStyles.thumb} resizeMode="cover" />
        <View style={photoStyles.zoomBadge}>
          <ZoomIn color={theme.colors.textInverse} size={14} />
        </View>
      </TouchableOpacity>

      <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <View style={photoStyles.modalBg}>
          <TouchableOpacity style={photoStyles.closeBtn} onPress={() => setFullscreen(false)} hitSlop={16}>
            <X color={theme.colors.textInverse} size={26} />
          </TouchableOpacity>
          <Image source={{ uri }} style={photoStyles.fullImg} resizeMode="contain" />
          <Text variant="caption" style={photoStyles.modalLabel}>{label}</Text>
        </View>
      </Modal>
    </>
  );
}

const photoStyles = StyleSheet.create({
  wrap: { position: 'relative', borderRadius: theme.layout.radius.md, overflow: 'hidden' },
  thumb: { width: '100%', height: 160, backgroundColor: theme.colors.border },
  zoomBadge: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.layout.radius.full,
    padding: 4,
  },
  placeholder: {
    height: 160,
    borderRadius: theme.layout.radius.md,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  placeholderText: { marginTop: 4 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  closeBtn: { position: 'absolute', top: 52, right: theme.spacing.md, zIndex: 10 },
  fullImg: { width: '100%', height: '75%' },
  modalLabel: { color: theme.colors.textInverse, marginTop: theme.spacing.sm },
});

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactElement; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.icon}>{icon}</View>
      <View style={infoStyles.content}>
        <Text variant="caption" color="muted">{label}</Text>
        <Text variant="body" weight="medium">{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  icon: { marginTop: 2, width: 20, alignItems: 'center' },
  content: { flex: 1, gap: 1 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProviderDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: provider, isLoading, isError } = useQuery({
    queryKey: ['adminProviderDetail', id],
    queryFn: () => adminService.getProviderDetail(id),
    enabled: !!id,
  });

  const onActionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'pending-providers'] });
    queryClient.invalidateQueries({ queryKey: ['adminProviderDetail', id] });
    router.back();
  };

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: () => adminService.approve(id),
    onSuccess: () => { toast.success(t('admin.approve_success')); onActionSuccess(); },
    onError: () => toast.error(t('admin.approve_error')),
  });

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: () => adminService.reject(id),
    onSuccess: () => { toast.success(t('admin.reject_success')); onActionSuccess(); },
    onError: () => toast.error(t('admin.reject_error')),
  });

  const confirmApprove = () => {
    if (!provider) return;
    Alert.alert(
      t('admin.approve_confirm_title'),
      t('admin.approve_confirm_desc', { name: provider.full_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.approve'), onPress: () => approve() },
      ]
    );
  };

  const confirmReject = () => {
    if (!provider) return;
    Alert.alert(
      t('admin.reject_confirm_title'),
      t('admin.reject_confirm_desc', { name: provider.full_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.reject'), style: 'destructive', onPress: () => reject() },
      ]
    );
  };

  const isBn = i18n.language === 'bn';
  const actioning = approving || rejecting;
  const registeredDate = provider
    ? new Date(provider.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" style={styles.headerTitle}>
          {t('admin_detail.title')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : isError || !provider ? (
        <View style={styles.errorWrap}>
          <Text variant="body" color="muted" align="center">{t('common.error')}</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Profile section */}
            <Card style={styles.section}>
              <View style={styles.profileRow}>
                {provider.photo_url ? (
                  <Image source={{ uri: provider.photo_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <User color={theme.colors.primary} size={28} />
                  </View>
                )}
                <View style={styles.profileMeta}>
                  <Text variant="h4" weight="bold">{provider.full_name}</Text>
                  <Text variant="caption" color="muted">
                    {t('admin_detail.registered')} {registeredDate}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <InfoRow
                icon={<Phone color={theme.colors.textMuted} size={15} />}
                label={t('admin_detail.mobile')}
                value={provider.mobile}
              />
              {provider.email ? (
                <InfoRow
                  icon={<Mail color={theme.colors.textMuted} size={15} />}
                  label={t('admin_detail.email')}
                  value={provider.email}
                />
              ) : null}
              <InfoRow
                icon={<CreditCard color={theme.colors.textMuted} size={15} />}
                label={t('admin_detail.nid')}
                value={provider.nid}
              />
              {provider.bio ? (
                <InfoRow
                  icon={<FileText color={theme.colors.textMuted} size={15} />}
                  label={t('admin_detail.bio')}
                  value={provider.bio}
                />
              ) : null}
            </Card>

            {/* NID photos */}
            <Card style={styles.section}>
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                {t('admin_detail.nid_photos')}
              </Text>
              <Text variant="caption" color="muted" style={styles.sectionHint}>
                {t('admin_detail.nid_photos_hint')}
              </Text>
              <View style={styles.photoGrid}>
                <View style={styles.photoCell}>
                  <Text variant="caption" color="muted" style={styles.photoLabel}>
                    {t('admin_detail.nid_front')}
                  </Text>
                  <PhotoCard uri={provider.nid_photo_url} label={t('admin_detail.nid_front')} />
                </View>
                <View style={styles.photoCell}>
                  <Text variant="caption" color="muted" style={styles.photoLabel}>
                    {t('admin_detail.nid_back')}
                  </Text>
                  <PhotoCard uri={provider.nid_photo_back_url} label={t('admin_detail.nid_back')} />
                </View>
              </View>
            </Card>

            {/* Skills */}
            <Card style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Briefcase color={theme.colors.primary} size={16} />
                <Text variant="body" weight="semibold">{t('admin_detail.skills')}</Text>
              </View>
              {provider.skills.length === 0 ? (
                <Text variant="caption" color="muted" style={styles.emptySkills}>
                  {t('admin_detail.no_skills')}
                </Text>
              ) : (
                <View style={styles.skillsList}>
                  {provider.skills.map((skill) => (
                    <View key={skill.id} style={styles.skillChip}>
                      <Text variant="caption" weight="medium">
                        {isBn && skill.category_name_bn ? skill.category_name_bn : skill.category_name ?? skill.category_id}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <View style={styles.footerSpacer} />
          </ScrollView>

          {/* Sticky action footer */}
          {provider.status === 'pending' && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, actioning && styles.btnDisabled]}
                onPress={confirmReject}
                disabled={actioning}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <XCircle color={theme.colors.surface} size={18} />
                <Text variant="body" weight="semibold" color="inverse">
                  {rejecting ? t('common.loading') : t('admin.reject')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, actioning && styles.btnDisabled]}
                onPress={confirmApprove}
                disabled={actioning}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <CheckCircle color={theme.colors.surface} size={18} />
                <Text variant="body" weight="semibold" color="inverse">
                  {approving ? t('common.loading') : t('admin.approve')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  loader: { marginTop: theme.spacing['2xl'] },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  scroll: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 110 },
  section: { padding: theme.spacing.md, gap: theme.spacing.xs },
  sectionTitle: { marginBottom: 2 },
  sectionHint: { marginBottom: theme.spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.xs },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  avatar: { width: 64, height: 64, borderRadius: theme.layout.radius.full },
  avatarPlaceholder: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMeta: { flex: 1, gap: 4 },
  photoGrid: { flexDirection: 'row', gap: theme.spacing.sm },
  photoCell: { flex: 1, gap: theme.spacing.xs },
  photoLabel: { marginBottom: 2 },
  emptySkills: { marginTop: 4 },
  skillsList: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: 4 },
  skillChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.layout.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  footerSpacer: { height: 8 },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    height: 50,
    borderRadius: theme.layout.radius.md,
  },
  approveBtn: { backgroundColor: theme.colors.success },
  rejectBtn: { backgroundColor: theme.colors.error },
  btnDisabled: { opacity: 0.5 },
});
