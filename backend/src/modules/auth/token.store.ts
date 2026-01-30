import { StoredRefreshToken } from '@modules/auth/auth.types';
import { UserRole } from '@modules/users/user.types';


const refreshTokenStore = new Map<string, StoredRefreshToken>();

export const RefreshTokenStore = {
  save(tokenId: string, user: {id: string; email: string; role: UserRole, tokenVersion: number, deviceId: string}) {
    refreshTokenStore.set(tokenId,
      { userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion,
        deviceId: user.deviceId, revoked: false });
  },

  get(tokenId: string): StoredRefreshToken | undefined {
    return refreshTokenStore.get(tokenId);
  },

  revoke(tokenId: string) {
    const token = refreshTokenStore.get(tokenId);
    if (token) token.revoked = true;
  },

  revokeByDevice(userId: string, deviceId: string) {
    for (const token of refreshTokenStore.values()) {
      if (token.userId === userId && token.deviceId === deviceId) {
        token.revoked = true;
      }
    }
  },

  revokeAll(userId: string) {
    for (const token of refreshTokenStore.values()) {
      if (token.userId === userId) {
        token.revoked = true;
      }
    }
  },

  isValid(tokenId: string) {
    const token = refreshTokenStore.get(tokenId);
    return token && !token.revoked;
  },
};
