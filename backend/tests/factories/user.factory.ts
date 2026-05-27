import bcrypt from 'bcrypt';
import { getTestDb } from '../helpers/db';
import { UserRole, UserStatus } from '../../src/modules/users/user.types';
import { AuthMethod } from '../../src/modules/auth/auth.types';

let _seq = 0;
function seq() { return ++_seq; }

export interface FactoryUserOptions {
  role?: UserRole;
  status?: UserStatus;
  email?: string;
  mobile?: string;
  nid?: string;
  password?: string;
}

export interface FactoryUserResult {
  userId: string;
  shortCode: string;
  authAccountId: string;
  mobile: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Creates a fully seeded user + auth_account row in the test DB.
 * Returns plain-text password alongside the created IDs.
 */
export async function createUser(opts: FactoryUserOptions = {}): Promise<FactoryUserResult> {
  const db = getTestDb();
  const n = seq();

  const role = opts.role ?? UserRole.RESIDENT;
  const status = opts.status ?? (role === UserRole.PROVIDER ? UserStatus.PENDING : UserStatus.ACTIVE);
  const password = opts.password ?? 'Password@123';
  const mobile = opts.mobile ?? `0170000${String(n).padStart(4, '0')}`;
  const nid = opts.nid ?? `100000${String(n).padStart(4, '0')}`;
  const email = opts.email ?? `user${n}@test.com`;

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db('users')
    .insert({
      full_name: `Test User ${n}`,
      mobile,
      nid,
      email,
      role,
      status,
      area: db.raw(`ST_SetSRID(ST_MakePoint(90.4125, 23.8103), 4326)`),
    })
    .returning(['id', 'short_code']);

  const [auth] = await db('auth_accounts')
    .insert({
      user_id: user.id,
      auth_method: AuthMethod.PASSWORD,
      password_hash: passwordHash,
      refresh_token_version: db.raw('gen_random_uuid()'),
    })
    .returning(['id']);

  return {
    userId: user.id,
    shortCode: user.short_code,
    authAccountId: auth.id,
    mobile,
    email,
    password,
    role,
    status,
  };
}

export async function createAdmin(opts: Omit<FactoryUserOptions, 'role'> = {}): Promise<FactoryUserResult> {
  return createUser({ ...opts, role: UserRole.ADMIN, status: UserStatus.ACTIVE });
}

export async function createProvider(opts: Omit<FactoryUserOptions, 'role'> = {}): Promise<FactoryUserResult> {
  return createUser({ ...opts, role: UserRole.PROVIDER, status: UserStatus.PENDING });
}
