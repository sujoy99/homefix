import { UserRole } from '@homefix/shared';
import type { UserSession } from '../../store/authStore';

let _seq = 0;
function seq() { return ++_seq; }

export function buildUserSession(overrides: Partial<UserSession> = {}): UserSession {
  const n = seq();
  return {
    id: `user-${n}`,
    role: UserRole.RESIDENT,
    fullName: `Test User ${n}`,
    mobile: `0170000${String(n).padStart(4, '0')}`,
    email: `user${n}@test.com`,
    ...overrides,
  };
}

export function buildProviderSession(overrides: Partial<UserSession> = {}): UserSession {
  return buildUserSession({ role: UserRole.PROVIDER, ...overrides });
}

export function buildAdminSession(overrides: Partial<UserSession> = {}): UserSession {
  return buildUserSession({ role: UserRole.ADMIN, ...overrides });
}

export function buildTokenPair() {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
}
