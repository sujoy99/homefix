import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { theme } from '@/theme';
import { Text } from '@/components/ui/Text';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = ({
  label,
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  disabled,
  leftIcon,
  style,
  ...props
}: ButtonProps) => {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  
  // Determine text color based on variant
  let textColor: 'inverse' | 'primary' | 'default' = 'inverse';
  if (isOutline || isGhost) textColor = 'primary';
  if (variant === 'secondary') textColor = 'default';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || isLoading}
      style={[
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={textColor === 'inverse' ? theme.colors.textInverse : theme.colors.primary} 
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <Text 
            variant="body" 
            weight="semibold" 
            color={textColor}
            style={disabled ? styles.textDisabled : undefined}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16, // Matched with Input
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  
  // Sizes
  size_md: {
    height: 44,
    paddingHorizontal: theme.spacing.md,
  },
  size_lg: {
    height: 56, // Increased for premium feel
    paddingHorizontal: theme.spacing.lg,
    ...theme.layout.shadow.md, // More prominent shadow for buttons
  },
  
  // Variants
  variant_primary: {
    backgroundColor: theme.colors.primary,
  },
  variant_secondary: {
    backgroundColor: theme.colors.secondary,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  
  // States
  disabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.border,
    borderColor: 'transparent',
  },
  textDisabled: {
    color: theme.colors.textMuted,
  },
});
