/**
 * In-memory invalidation store for logoutAll.
 *
 * When a user calls logoutAll, their userId is recorded with the current
 * timestamp. authGuard rejects any access token whose `iat` (issued-at)
 * falls before that timestamp — no DB call on the hot path.
 *
 * Trade-off: does not survive server restarts. Tokens issued before the
 * restart and before the last logoutAll remain valid for up to their TTL
 * after a restart. Acceptable for single-instance; upgrade to Redis when
 * running multiple instances.
 */

const store = new Map<string, number>(); // userId → invalidatedAt (ms)

export const InvalidationStore = {
  /**
   * Mark all sessions for this user as invalid from now on.
   */
  invalidate(userId: string): void {
    store.set(userId, Date.now());
  },

  /**
   * Returns true if the token (identified by its iat in seconds) was issued
   * before the most recent logoutAll for this user.
   */
  isRevoked(userId: string, tokenIatSeconds: number): boolean {
    const invalidatedAt = store.get(userId);
    if (!invalidatedAt) return false;
    return tokenIatSeconds * 1000 < invalidatedAt;
  },
};
