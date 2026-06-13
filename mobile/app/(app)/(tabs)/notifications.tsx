import React, { useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { useNotificationStore } from '@/store/notificationStore';
import { AppNotification } from '@/services/notification.service';
import { toast } from '@/utils/toast';
import { theme } from '@/theme';

function relativeTime(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return t('notifications.just_now');
  if (diff < 3600) return t('notifications.minutes_ago', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('notifications.hours_ago', { count: Math.floor(diff / 3600) });
  return t('notifications.days_ago', { count: Math.floor(diff / 86400) });
}

function NotificationItem({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
}) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const title = isBn ? item.title_bn : item.title_en;
  const body = isBn ? item.body_bn : item.body_en;

  return (
    <TouchableOpacity
      style={[styles.item, !item.is_read && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {!item.is_read && <View style={styles.unreadDot} />}
      <View style={styles.itemContent}>
        <Text variant="body" weight="semibold" style={styles.itemTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color="muted" style={styles.itemBody} numberOfLines={2}>
          {body}
        </Text>
        <Text variant="caption" color="muted" style={styles.itemTime}>
          {relativeTime(item.created_at, t)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { notifications, unreadCount: _unreadCount, hasMore, loading, fetchNotifications, markAsRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(false);
    }
  }, [loading, hasMore, fetchNotifications]);

  const handlePress = useCallback(
    async (item: AppNotification) => {
      if (!item.is_read) {
        try {
          await markAsRead(item.id);
        } catch {
          toast.error(t('notifications.mark_read_error'));
        }
      }
      const callUrl = item.data?.callUrl as string | undefined;
      if (item.type === 'CALL_STARTED' && callUrl) {
        await WebBrowser.openBrowserAsync(callUrl);
        return;
      }
      const jobId = item.data?.jobId as string | undefined;
      if (jobId) {
        if (item.type === 'NEW_MESSAGE') {
          router.push(`/(app)/booking/job/chat/${jobId}` as never);
        } else {
          router.push(`/(app)/booking/job/${jobId}` as never);
        }
      }
    },
    [markAsRead, router, t],
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Bell color={theme.colors.primary} size={48} />
        <Text variant="h4" weight="semibold" align="center" style={styles.emptyTitle}>
          {t('notifications.empty_title')}
        </Text>
        <Text variant="body" color="muted" align="center">
          {t('notifications.empty_desc')}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || notifications.length === 0) return null;
    return (
      <TouchableOpacity
        style={styles.loadMore}
        onPress={handleLoadMore}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('notifications.load_more')}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} size="small" />
        ) : (
          <Text variant="body" color="muted">{t('notifications.load_more')}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h2" weight="bold">{t('notifications.title')}</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationItem item={item} onPress={handlePress} />}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && notifications.length === 0}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={renderFooter()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listContent: {
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  itemUnread: {
    backgroundColor: theme.colors.infoBackground,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
    marginRight: theme.spacing.sm,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: theme.colors.text,
  },
  itemBody: {
    marginTop: 2,
  },
  itemTime: {
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    marginTop: theme.spacing.sm,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
});
