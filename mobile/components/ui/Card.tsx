import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from '@/theme';

export interface CardProps extends ViewProps {
  elevated?: boolean;
}

export const Card = ({ style, elevated = false, children, ...props }: CardProps) => {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevated: {
    borderWidth: 0,
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.layout.shadow.md,
  },
});
