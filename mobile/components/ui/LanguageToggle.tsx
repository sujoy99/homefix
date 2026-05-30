import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import { Text } from './Text';
import { theme } from '@/theme';

interface LanguageToggleProps {
  style?: ViewStyle;
}

export function LanguageToggle({ style }: LanguageToggleProps) {
  const { i18n } = useTranslation();

  const toggle = () => {
    i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn');
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={i18n.language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
    >
      <Globe size={14} color={theme.colors.primary} />
      <Text variant="caption" weight="bold" color="primary" style={styles.label}>
        {i18n.language === 'bn' ? 'EN' : 'বাং'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '15',
  },
  label: {
    marginLeft: 4,
  },
});
