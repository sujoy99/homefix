import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { Text } from '@/components/ui/Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = ({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {label && (
          <View style={styles.labelContainer}>
            <Text variant="caption" weight="bold" style={styles.label}>
              {label}
            </Text>
          </View>
        )}

        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && (
        <Text variant="caption" color="error" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20, // Slightly more space for the legend
    marginTop: 10, // Top margin for the legend to sit
  },
  labelContainer: {
    position: 'absolute',
    top: -12,
    left: 12,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 6,
    zIndex: 1,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: '#FFFFFF', // Unified for legend style
    paddingHorizontal: theme.spacing.md,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'System',
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
  errorText: {
    marginTop: theme.spacing.xs,
    marginLeft: 12,
  },
});
