import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Home, CalendarDays, Briefcase, User, ShieldCheck } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { UserRole } from '@homefix/shared';
import { useAuthStore } from '@/store/authStore';
import { theme } from '@/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const isProvider = user?.role === UserRole.PROVIDER;
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? t('nav.approvals') : t('nav.home'),
          tabBarIcon: ({ color, size }) =>
            isAdmin
              ? <ShieldCheck color={color} size={size} />
              : <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('nav.bookings'),
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
          href: isProvider || isAdmin ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t('nav.jobs'),
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
          href: isProvider && !isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
