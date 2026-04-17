import bcrypt from 'bcrypt';
import { users } from '@modules/users/user.store';
import { User, UserResgistrationRequest, UserRole, UserStatus } from '@modules/users/user.types';
import { env } from '@config/env';
import { AuthRepository } from './auth.repository';
import { AuthMethod } from './auth.types';

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

export async function seedDefaultAdminInDB() {

  const DEFAULT_ADMIN_EMAIL = env.defaultAdminEmail;
  const DEFAULT_ADMIN_PASSWORD = env.defaultAdminPassword;
  const DEFAULT_ADMIN_NID = env.defaultAdminNID;
  const DEFAULT_ADMIN_MOBILE = env.defaultAdminMobile;

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  const admin: UserResgistrationRequest = {
    full_name: 'System Admin',
    email: DEFAULT_ADMIN_EMAIL,
    hashedPassword: hashedPassword,
    mobile: DEFAULT_ADMIN_MOBILE,
    nid: DEFAULT_ADMIN_NID,
    role: UserRole.ADMIN,
    latitude: 0,
    longitude: 0,
    auth_method: AuthMethod.PASSWORD,
    status: UserStatus.ACTIVE
  }

  const exists = await AuthRepository.findByMobile(DEFAULT_ADMIN_MOBILE);
  if (exists) {
    console.log('Default admin already exists');
    return;
  }
  AuthRepository.createUser(admin);

  console.log('Default admin created in system');
}
