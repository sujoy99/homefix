import { colors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, layout } from './spacing';

/**
 * ============================
 * Central Theme Export
 * ============================
 * Access all design system tokens from here.
 * 
 * Example usage:
 *   import { theme } from '@/theme';
 *   
 *   const styles = StyleSheet.create({
 *     container: {
 *       backgroundColor: theme.colors.background,
 *       padding: theme.spacing.md,
 *       borderRadius: theme.layout.radius.lg,
 *     }
 *   });
 */

export const theme = {
  colors,
  typography,
  spacing,
  layout,
};

export const darkTheme = {
  ...theme,
  colors: darkColors,
};

// Types for auto-completion in styled-components or generic usage if needed
export type Theme = typeof theme;
