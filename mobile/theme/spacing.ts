/**
 * ============================
 * Spacing & Layout System
 * ============================
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,       // Base padding
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,    // Common for accessible touch targets
};

export const layout = {
  // Corner radiuses
  radius: {
    sm: 4,
    md: 8,
    lg: 12,     // Default card radius
    xl: 16,
    full: 9999, // Pills, circular avatars
  },
  
  // Heights
  buttonHeight: 48, // Minimum touch target size
  inputHeight: 48,
  
  // Shadows
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};
