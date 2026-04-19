/**
 * ============================
 * Typography System
 * ============================
 * Uses system fonts by default to save bundle size,
 * but structured to easily drop in custom fonts later.
 */

export const typography = {
  // Font sizes
  size: {
    xs: 12,
    sm: 14,
    md: 16,     // Base body text
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font weights
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
};
