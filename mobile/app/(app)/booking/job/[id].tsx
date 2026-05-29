import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { theme } from '@/theme';

/**
 * Job detail / status tracking screen — placeholder shell.
 * Full implementation: HF-040
 */
export default function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text variant="h4" weight="bold" style={styles.headerTitle}>Job Detail</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.body}>
        <Text variant="body" color="muted" align="center">
          Job status tracking coming soon (HF-040)
        </Text>
        <Text variant="caption" color="muted" align="center" style={{ marginTop: 8 }}>
          ID: {id}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  body: { flex: 1, justifyContent: 'center', padding: theme.spacing.xl },
});
