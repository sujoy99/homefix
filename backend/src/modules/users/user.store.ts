import { User } from './user.types';

export const users = new Map<string, User>();

export const UserStore = {
  /**
   * Save or update user
   */
  save(userId: string, user: User) {
    users.set(userId, user);
  },

  /**
   * Get user by ID
   */
  get(userId: string): User | undefined {
    return users.get(userId);
  },

  /**
   * Increment tokenVersion
   * - Used for logout-all / force logout / password reset
   * - Invalidates ALL existing access tokens
   */
  incrementTokenVersion(userId: string): void {
    const user = users.get(userId);
    if (!user) return;

    users.set(userId, {
      ...user,
      tokenVersion: user.tokenVersion + 1,
    });
  },
};
