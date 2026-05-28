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

  // Semantic variants for use in StyleSheet
  h1: { fontSize: 36, fontWeight: '700' as const, lineHeight: 42 },
  h2: { fontSize: 30, fontWeight: '700' as const, lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
};
