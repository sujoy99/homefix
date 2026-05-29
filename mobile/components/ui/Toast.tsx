import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { useToastStore, ToastType } from '@/store/toastStore';
import { theme } from '@/theme';

const DISMISS_MS = 3000;

const config: Record<ToastType, { bg: string; icon: React.ReactNode; textColor: string }> = {
  error: {
    bg: theme.colors.error,
    icon: <AlertCircle color="#fff" size={20} />,
    textColor: '#fff',
  },
  success: {
    bg: theme.colors.success,
    icon: <CheckCircle2 color="#fff" size={20} />,
    textColor: '#fff',
  },
  info: {
    bg: theme.colors.primary,
    icon: <Info color="#fff" size={20} />,
    textColor: '#fff',
  },
};

export function Toast() {
  const { message, type, visible, hideToast } = useToastStore();
  const translateY = useRef(new Animated.Value(-120)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      if (timer.current) clearTimeout(timer.current);

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      timer.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }).start(() => hideToast());
      }, DISMISS_MS);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [visible, message]);

  const { bg, icon } = config[type] ?? config.info;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, backgroundColor: bg },
        { transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.row}>
        {icon}
        <Text variant="body" weight="medium" style={styles.text} numberOfLines={3}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: theme.layout.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    zIndex: 9999,
    elevation: 10,
    ...theme.layout.shadow.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  text: {
    flex: 1,
    color: '#fff',
  },
});
