import bcrypt from 'bcrypt';
import { UserResgistrationRequest, UserRole, UserStatus } from '@modules/users/user.types';
import { env } from '@config/env';
import { AuthRepository } from './auth.repository';
import { AuthMethod } from './auth.types';

/**
 * ============================
 *  Default User Seeder (DB)
 * ============================
 * - Runs on server startup
 * - Creates admin user in DB if not exists
 */
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
  };

  const exists = await AuthRepository.findByMobile(DEFAULT_ADMIN_MOBILE);
  if (exists) {
    console.log('Default admin already exists');
    return;
  }
  await AuthRepository.createUser(admin);

  console.log('Default admin created in system');
}
