import React from 'react';
import { UserRole } from '@homefix/shared';
import { useAuthStore } from '@/store/authStore';
import ResidentHomeScreen from '@/components/screens/ResidentHomeScreen';
import ProviderHomeScreen from '@/components/screens/ProviderHomeScreen';
import AdminHomeScreen from '@/components/screens/AdminHomeScreen';

/**
 * Home tab — role-aware entry point.
 * Resident: ResidentHomeScreen (HF-026)
 * Provider: ProviderHomeScreen (HF-029)
 * Admin: AdminHomeScreen (minimal — full panel in Sprint 7 web)
 */
export default function HomeTab() {
  const role = useAuthStore((state) => state.user?.role);
  if (role === UserRole.PROVIDER) return <ProviderHomeScreen />;
  if (role === UserRole.ADMIN) return <AdminHomeScreen />;
  return <ResidentHomeScreen />;
}
