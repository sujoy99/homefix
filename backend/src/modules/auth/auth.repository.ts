import { randomUUID } from 'crypto';
import { User, CreateUserInput } from '@modules/users/user.types';

const users = new Map<string, User>();

export class AuthRepository {
  /**
   * Find a user by email address
   *
   * Purpose:
   * - Used during authentication (login, registration)
   * - Ensures email uniqueness
   *
   * Behavior:
   * - Returns the user if email exists
   * - Returns null if no matching user is found
   *
   * Notes:
   * - Email comparison is case-insensitive at input validation level
   * - Repository layer is responsible for data lookup only
   */
  static async findByEmail(email: string): Promise<User | null> {
    for (const user of users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  /**
   * Create user
   * - Repository generates ID
   * - Returns full User entity
   */
  static async create(data: CreateUserInput): Promise<User> {
    const user: User = {
      id: randomUUID(),
      ...data,
    };

    users.set(user.id, user);
    return user;
  }
}
