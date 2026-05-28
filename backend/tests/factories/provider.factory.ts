import { getTestDb } from '../helpers/db';
import { createUser, FactoryUserResult } from './user.factory';
import { UserRole, UserStatus } from '../../src/modules/users/user.types';

export interface FactoryProviderResult extends FactoryUserResult {
  profileId: string;
}

export async function createProvider(opts: { mobile?: string; status?: UserStatus } = {}): Promise<FactoryProviderResult> {
  const db = getTestDb();

  const user = await createUser({
    role: UserRole.PROVIDER,
    status: opts.status ?? UserStatus.ACTIVE,
    ...(opts.mobile !== undefined ? { mobile: opts.mobile } : {}),
  });

  const [profile] = await db('provider_profiles')
    .insert({ user_id: user.userId })
    .returning(['id']);

  return { ...user, profileId: profile.id };
}

export async function addSkillToProvider(
  profileId: string,
  categoryId: string,
  isPrimary = false
): Promise<string> {
  const db = getTestDb();
  const [skill] = await db('provider_skills')
    .insert({ provider_id: profileId, category_id: categoryId, is_primary: isPrimary })
    .returning(['id']);
  return skill.id as string;
}
