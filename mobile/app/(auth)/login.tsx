import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/theme';
import { Link, useRouter } from 'expo-router';

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();

  const handleDevLogin = async () => {
    // DEV ONLY: Bypass auth for testing
    await setSession(
      { id: '1', role: 'resident', fullName: 'Test Resident' },
      'mock_access_token',
      'mock_refresh_token'
    );
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(nextLang);
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        {/* Language Toggle */}
        <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
          <Text variant="caption" weight="bold" color="primary">
            {i18n.language === 'bn' ? 'English' : 'বাংলা'}
          </Text>
        </TouchableOpacity>

        {/* Header Area */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text variant="h2" weight="bold" color="white">HF</Text>
          </View>
          <Text variant="h1" weight="bold" style={styles.title}>
            {t('common.welcome')}
          </Text>
          <Text variant="body" color="muted">
            {t('auth.login_subtitle', 'Sign in to access your home services')}
          </Text>
        </View>

        {/* Login Form Card */}
        <Card style={styles.card}>
          <Input 
            label={t('auth.mobile')} 
            placeholder="017XXXXXXXX"
            keyboardType="phone-pad"
            style={styles.input}
          />
          
          <Input 
            label={t('auth.password')} 
            placeholder="********"
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity style={styles.forgotPass}>
            <Text variant="caption" color="primary" weight="medium">
              {t('auth.forgot_password', 'Forgot Password?')}
            </Text>
          </TouchableOpacity>

          <Button 
            label={t('auth.login')} 
            onPress={handleDevLogin}
            style={styles.loginBtn}
          />
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="body" color="muted">
            {t('auth.no_account', "Don't have an account?")}{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text variant="body" color="primary" weight="bold">
              {t('auth.register_now', 'Register Now')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  langToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '10',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
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
  card: {
    padding: 24,
    borderRadius: 24,
  },
  input: {
    marginBottom: 16,
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  loginBtn: {
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
});
