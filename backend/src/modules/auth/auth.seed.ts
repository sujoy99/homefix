import bcrypt from 'bcrypt';
import { users } from '@modules/users/user.store';
import { User, UserRole } from '@modules/users/user.types';
import { env } from '@config/env';

/**
 * ============================
 *  Default User Seeder
 * ============================
 * - Runs on server startup
 * - Creates admin user if not exists
 * - Safe for multiple restarts
 */
export async function seedDefaultAdmin() {

    const DEFAULT_ADMIN_EMAIL = env.defaultAdminEmail;
    const DEFAULT_ADMIN_PASSWORD = env.defaultAdminPassword;

  // Check if admin already exists
  const exists = Array.from(users.values()).some(
    (user) => user.email === DEFAULT_ADMIN_EMAIL
  );

  if (exists) {
    console.log('Default admin already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  const adminUser: User = {
    id: crypto.randomUUID(),
    name: 'System Admin',
    email: DEFAULT_ADMIN_EMAIL,
    password: hashedPassword,
    role: UserRole.ADMIN,
    tokenVersion: 1
  };

  users.set(adminUser.id, adminUser);

  console.log('Default admin created');
}
