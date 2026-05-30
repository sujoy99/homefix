import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userLoginPayloadSchema, UserLoginPayload, AuthMethod } from '@homefix/shared';
import { Lock, Phone, Mail } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { getApiError } from '@/utils/apiError';
import { getDeviceId } from '@/utils/deviceId';
import { toast } from '@/utils/toast';
import { ErrorCode } from '@homefix/shared';

export default function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'email'>('mobile');
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UserLoginPayload>({
    resolver: zodResolver(userLoginPayloadSchema),
    defaultValues: {
      method: AuthMethod.PASSWORD,
      deviceId: '',
      mobile: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    getDeviceId().then((id) => setValue('deviceId', id));
  }, [setValue]);

  const onSubmit = async (data: UserLoginPayload) => {
    setLoading(true);
    try {
      await login(data);
    } catch (error) {
      setLoading(false);
      const code = (error as any)?.response?.data?.error_code;
      if (code === ErrorCode.ACCOUNT_NOT_APPROVED) {
        router.replace('/(auth)/pending-approval');
      } else {
        toast.error(getApiError(error, t));
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LanguageToggle style={styles.langToggle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoPlaceholder}>
              <Text variant="h2" weight="bold" color="inverse">HF</Text>
            </View>
            <Text variant="h1" weight="bold" style={styles.title}>
              {t('common.welcome')}
            </Text>
            <Text variant="body" color="muted">
              {t('auth.login_subtitle')}
            </Text>
          </View>

          {/* Tabs for Login Method */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, loginMethod === 'mobile' && styles.activeTab]}
              onPress={() => setLoginMethod('mobile')}
              accessibilityRole="tab"
              accessibilityLabel={t('auth.mobile')}
              accessibilityState={{ selected: loginMethod === 'mobile' }}
            >
              <Text color={loginMethod === 'mobile' ? 'primary' : 'muted'} weight="bold">{t('auth.mobile')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, loginMethod === 'email' && styles.activeTab]}
              onPress={() => setLoginMethod('email')}
              accessibilityRole="tab"
              accessibilityLabel={t('auth.email')}
              accessibilityState={{ selected: loginMethod === 'email' }}
            >
              <Text color={loginMethod === 'email' ? 'primary' : 'muted'} weight="bold">{t('auth.email')}</Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          <Card style={styles.card}>
            {loginMethod === 'mobile' ? (
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
                    error={(errors as any).mobile?.message}
                    leftIcon={<Phone size={20} color={theme.colors.textMuted} />}
                  />
                )}
              />
            ) : (
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('auth.email', 'Email Address')}
                    placeholder="rahim@example.com"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                    error={(errors as any).email?.message}
                    leftIcon={<Mail size={20} color={theme.colors.textMuted} />}
                  />
                )}
              />
            )}

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
                  error={(errors as any).password?.message}
                  leftIcon={<Lock size={20} color={theme.colors.textMuted} />}
                />
              )}
            />

            <TouchableOpacity
              style={styles.forgotPass}
              accessibilityRole="button"
              accessibilityLabel={t('auth.forgot_password', 'Forgot Password?')}
            >
              <Text variant="caption" color="primary" weight="medium">
                {t('auth.forgot_password', 'Forgot Password?')}
              </Text>
            </TouchableOpacity>

            <Button 
              label={t('auth.login')} 
              onPress={handleSubmit(onSubmit)}
              isLoading={loading}
              style={styles.loginBtn}
            />
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="body" color="muted">
              {t('auth.no_account', "Don't have an account?")}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/select-role')}
              accessibilityRole="link"
              accessibilityLabel={t('auth.register_now', 'Register Now')}
            >
              <Text variant="body" color="primary" weight="bold">
                {t('auth.register_now', 'Register Now')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  langToggle: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '10',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: theme.colors.border + '30',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  loginBtn: {
    borderRadius: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
});
