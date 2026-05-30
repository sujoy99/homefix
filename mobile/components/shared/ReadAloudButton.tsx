import React, { useState, useCallback, useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { Volume2, VolumeX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { theme } from '@/theme';

type Props = {
  text: string;
  language?: string;
};

export function ReadAloudButton({ text, language = 'bn-BD' }: Props) {
  const { t } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const toggle = useCallback(async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    Speech.speak(text, {
      language,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  }, [isSpeaking, text, language]);

  return (
    <TouchableOpacity
      style={[styles.btn, isSpeaking && styles.btnActive]}
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={isSpeaking ? t('job_detail.read_aloud_stop') : t('job_detail.read_aloud')}
      accessibilityHint={t('job_detail.read_aloud_hint')}
    >
      {isSpeaking
        ? <VolumeX size={16} color={theme.colors.primary} />
        : <Volume2 size={16} color={theme.colors.primary} />
      }
      <Text variant="caption" weight="medium" style={styles.label}>
        {isSpeaking ? t('job_detail.read_aloud_stop') : t('job_detail.read_aloud')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    minHeight: 36,
  },
  btnActive: {
    backgroundColor: theme.colors.raw.infoBackground,
  },
  label: {
    color: theme.colors.primary,
  },
});
