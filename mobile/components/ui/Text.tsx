import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { theme } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption';
  color?: 'default' | 'muted' | 'inverse' | 'primary' | 'error';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

/**
 * Custom Text component that hooks into the design system typography.
 */
export const Text = ({
  style,
  variant = 'body',
  color = 'default',
  weight = 'regular',
  align = 'left',
  children,
  ...props
}: TextProps) => {
  return (
    <RNText
      style={[
        styles.base,
        styles[`variant_${variant}`],
        styles[`color_${color}`],
        styles[`weight_${weight}`],
        { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System', // Will map to Inter once loaded
  },
  
  // Variants (Size)
  variant_h1: { fontSize: theme.typography.size['4xl'], lineHeight: 42 },
  variant_h2: { fontSize: theme.typography.size['3xl'], lineHeight: 36 },
  variant_h3: { fontSize: theme.typography.size['2xl'], lineHeight: 30 },
  variant_h4: { fontSize: theme.typography.size.xl, lineHeight: 28 },
  variant_body: { fontSize: theme.typography.size.md, lineHeight: 24 },
  variant_caption: { fontSize: theme.typography.size.sm, lineHeight: 20 },
  
  // Colors
  color_default: { color: theme.colors.text },
  color_muted: { color: theme.colors.textMuted },
  color_inverse: { color: theme.colors.textInverse },
  color_primary: { color: theme.colors.primary },
  color_error: { color: theme.colors.error },
  
  // Weights
  weight_regular: { fontWeight: theme.typography.weight.regular },
  weight_medium: { fontWeight: theme.typography.weight.medium },
  weight_semibold: { fontWeight: theme.typography.weight.semibold },
  weight_bold: { fontWeight: theme.typography.weight.bold },
});
