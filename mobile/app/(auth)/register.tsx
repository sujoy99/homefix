import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  userRegistrationPayloadSchema,
  UserRegistrationPayload,
} from '@homefix/shared';
import { theme } from '@/theme';
import { authService } from '@/services/auth.service';
import { UserRole, AuthMethod } from '@homefix/shared';
import { ArrowLeft, ChevronRight, User as UserIcon, Phone, Lock, Mail, CreditCard, Camera, Upload } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { LocationPicker } from '@/components/ui/LocationPicker';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getApiError } from '@/utils/apiError';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ role: string }>();
  const isProvider = params.role === UserRole.PROVIDER;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<UserRegistrationPayload>({
    resolver: zodResolver(userRegistrationPayloadSchema),
    defaultValues: {
      role: params.role === UserRole.PROVIDER ? UserRole.PROVIDER : UserRole.RESIDENT,
      auth_method: AuthMethod.PASSWORD,
      latitude: 0,
      longitude: 0,
      full_name: '',
      mobile: '',
      nid: '',
      email: '',
      password: '',
      photo_url: '',
      nid_photo_url: '',
    },
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const photoUrl = watch('photo_url');
  const nidPhotoUrl = watch('nid_photo_url');

  const pickImage = async (field: 'photo_url' | 'nid_photo_url') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: field === 'photo_url' ? [1, 1] : [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) {
      setValue(field, result.assets[0].uri);
    }
  };

  const onSubmit = async (data: UserRegistrationPayload) => {
    setLoading(true);
    try {
      await authService.register(data);
      setLoading(false);
      if (isProvider) {
        router.replace('/(auth)/pending-approval');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert(t('common.error'), getApiError(error, t));
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof UserRegistrationPayload)[] = [];

    if (step === 1) {
      fieldsToValidate = ['full_name', 'mobile', 'nid'];
    } else if (step === 2) {
      if (latitude === 0 && longitude === 0) {
        Alert.alert(t('common.error'), t('validation.location_required'));
        return;
      }
    } else if (step === 3) {
      fieldsToValidate = ['password'];
      if (watch('email')) fieldsToValidate.push('email');
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    if (step === 3 && !isProvider) {
      handleSubmit(onSubmit as any)();
    } else if (step === 4 && isProvider) {
      const isValid = await trigger(['nid_photo_url']);
      if (isValid) handleSubmit(onSubmit as any)();
    } else {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('auth.step_basic')}</Text>
      <Text style={styles.stepSubtitle}>{t('auth.registration_subtitle')}</Text>

      <Controller
        control={control}
        name="full_name"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.full_name')}
            placeholder="e.g. Rahim Ahmed"
            value={value}
            onChangeText={onChange}
            error={errors.full_name?.message}
            leftIcon={<UserIcon size={20} color={theme.colors.textMuted} />}
          />
        )}
      />

      <Controller
        control={control}
        name="mobile"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.mobile')}
            placeholder="017XXXXXXXX"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            error={errors.mobile?.message}
            leftIcon={<Phone size={20} color={theme.colors.textMuted} />}
          />
        )}
      />

      <Controller
        control={control}
        name="nid"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.nid')}
            placeholder="XXXXXXXXXXXXX"
            keyboardType="number-pad"
            value={value}
            onChangeText={onChange}
            error={errors.nid?.message}
            leftIcon={<CreditCard size={20} color={theme.colors.textMuted} />}
          />
        )}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('auth.step_location')}</Text>
      <Text style={styles.stepSubtitle}>{t('auth.location_subtitle')}</Text>

      <LocationPicker
        latitude={latitude}
        longitude={longitude}
        onLocationChange={(lat: number, lng: number) => {
          setValue('latitude', lat);
          setValue('longitude', lng);
        }}
        autoDetect={step === 2}
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('auth.step_auth')}</Text>
      <Text style={styles.stepSubtitle}>{t('auth.registration_subtitle')}</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.email')}
            placeholder="rahim@example.com"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            error={errors.email?.message}
            leftIcon={<Mail size={20} color={theme.colors.textMuted} />}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('auth.password')}
            placeholder="********"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
            leftIcon={<Lock size={20} color={theme.colors.textMuted} />}
          />
        )}
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('auth.step_documents')}</Text>
      <Text style={styles.stepSubtitle}>{t('auth.registration_subtitle')}</Text>

      <View style={styles.uploadGroup}>
        <Text style={styles.uploadLabel}>{t('auth.profile_photo')}</Text>
        <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('photo_url')}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.previewImage} />
          ) : (
            <>
              <Camera size={32} color={theme.colors.textMuted} />
              <Text style={styles.uploadText}>{t('auth.upload_photo')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.uploadGroup}>
        <Text style={styles.uploadLabel}>{t('auth.nid_photo')}</Text>
        <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('nid_photo_url')}>
          {nidPhotoUrl ? (
            <Image source={{ uri: nidPhotoUrl }} style={styles.previewImage} />
          ) : (
            <>
              <Upload size={32} color={theme.colors.textMuted} />
              <Text style={styles.uploadText}>{t('auth.upload_photo')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {errors.nid_photo_url && (
        <Text style={styles.errorText}>{errors.nid_photo_url.message}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('auth.register')}</Text>
          <LanguageToggle />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / (isProvider ? 4 : 3)) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{t('common.next')} {step} / {isProvider ? 4 : 3}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && isProvider && renderStep4()}
        </ScrollView>

        <View style={styles.footer}>
          {step < (isProvider ? 4 : 3) ? (
            <Button
              label={t('common.next')}
              onPress={nextStep}
              rightIcon={<ChevronRight size={20} color={theme.colors.textInverse} />}
            />
          ) : (
            <Button
              label={t('common.complete')}
              onPress={handleSubmit(onSubmit as any)}
              isLoading={loading}
            />
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h3,
    fontWeight: '700',
    color: theme.colors.text,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  stepContainer: {
    paddingTop: theme.spacing.md,
  },
  stepTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  stepSubtitle: {
    ...theme.typography.body1,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
  },
  uploadGroup: {
    marginBottom: theme.spacing.xl,
  },
  uploadLabel: {
    ...theme.typography.body2,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  uploadCard: {
    height: 140,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
