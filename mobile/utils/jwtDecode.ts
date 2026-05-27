import { UserRole, UserStatus } from '@homefix/shared';

export type JwtAccessPayload = {
  sub: string;
  mobile: string;
  email?: string | null;
  role: UserRole;
  status: UserStatus;
};

/**
 * Decodes a JWT payload without signature verification.
 * Verification happens server-side; this is only for restoring client state.
 */
export function decodeJwtPayload(token: string): JwtAccessPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );

    return JSON.parse(json) as JwtAccessPayload;
  } catch {
    return null;
  }
}
