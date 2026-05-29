import React from 'react';
import { UserRole } from '@homefix/shared';
import { useAuthStore } from '@/store/authStore';
import ResidentHomeScreen from '@/components/screens/ResidentHomeScreen';
import ProviderHomeScreen from '@/components/screens/ProviderHomeScreen';

/**
 * Home tab — role-aware entry point.
 * Resident: ResidentHomeScreen (HF-026)
 * Provider: ProviderHomeScreen (HF-029)
 */
export default function HomeTab() {
  const role = useAuthStore((state) => state.user?.role);
  return role === UserRole.PROVIDER ? <ProviderHomeScreen /> : <ResidentHomeScreen />;
}
