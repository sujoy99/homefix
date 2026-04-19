import React from 'react';
import { View, ViewProps, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/theme';

export interface ScreenProps extends ViewProps {
  scrollable?: boolean;
  safeArea?: boolean;
}

export const Screen = ({
  scrollable = false,
  safeArea = true,
  style,
  children,
  ...props
}: ScreenProps) => {
  const Container = safeArea ? SafeAreaView : View;
  
  if (scrollable) {
    return (
      <Container style={[styles.container, style]} {...props}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container style={[styles.container, styles.nonScrollContent, style]} {...props}>
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  nonScrollContent: {
    padding: theme.spacing.md,
  },
});
