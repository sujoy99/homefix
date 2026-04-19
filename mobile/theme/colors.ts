/**
 * ============================
 * Color Palette
 * ============================
 * Option 1: Classic Trust Blue (#2563EB)
 * 
 * To change the entire app's color scheme in the future,
 * simply update the hex values here. All UI components
 * reference these semantic names.
 */

// Core brand palette (Change these to swap themes)
const brand = {
  primary: '#2563EB',     // Trust Blue (Urban Company style)
  primaryLight: '#60A5FA',
  primaryDark: '#1D4ED8',
  
  secondary: '#F59E0B',   // Amber (for Book Now buttons)
  secondaryLight: '#FBBF24',
  secondaryDark: '#D97706',
};

// Neutral palette
const neutral = {
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',
};

// Semantic status colors
const semantic = {
  success: '#10B981',
  successBackground: '#D1FAE5',
  
  error: '#EF4444',
  errorBackground: '#FEE2E2',
  
  warning: '#F59E0B',
  warningBackground: '#FEF3C7',
  
  info: '#3B82F6',
  infoBackground: '#DBEAFE',
};

/**
 * Semantic theme mapping for light mode.
 * All components should use THESE variables, not the raw hex codes.
 */
export const colors = {
  // Brand
  primary: brand.primary,
  primaryLight: brand.primaryLight,
  primaryDark: brand.primaryDark,
  secondary: brand.secondary,
  
  // Backgrounds
  background: neutral.gray50,
  surface: neutral.white,
  surfaceElevated: neutral.white,
  
  // Text
  text: neutral.gray900,
  textMuted: neutral.gray500,
  textInverse: neutral.white,
  
  // Borders
  border: neutral.gray200,
  borderFocus: brand.primary,
  
  // Status
  ...semantic,
  
  // Raw access if strictly needed
  raw: { ...brand, ...neutral },
};

/**
 * Basic dark mode support mapping
 * (Can be expanded when dark mode is fully implemented)
 */
export const darkColors = {
  ...colors,
  background: neutral.gray900,
  surface: neutral.gray800,
  surfaceElevated: neutral.gray700,
  text: neutral.gray50,
  textMuted: neutral.gray400,
  border: neutral.gray700,
};
