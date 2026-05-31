import { getTestDb } from '../helpers/db';
import { createUser, FactoryUserResult } from './user.factory';
import { UserRole, UserStatus } from '../../src/modules/users/user.types';

export interface FactoryProviderResult extends FactoryUserResult {
  profileId: string;
}

/**
 * Creates a fully-seeded, profile-complete provider (≥70% completion).
 * Includes: photos, NID photos, GPS area, hourly_rate, and one skill.
 * Wallet tests that need an MFS account must add one explicitly.
 */
export async function createProvider(opts: { mobile?: string; status?: UserStatus } = {}): Promise<FactoryProviderResult> {
  const db = getTestDb();

  const user = await createUser({
    role: UserRole.PROVIDER,
    status: opts.status ?? UserStatus.ACTIVE,
    ...(opts.mobile !== undefined ? { mobile: opts.mobile } : {}),
  });

  // Set photo + NID photos so the profile completion check passes
  await db('users').where('id', user.userId).update({
    photo_url: 'https://cdn.example.com/test-photo.jpg',
    nid_photo_url: 'https://cdn.example.com/nid-front.jpg',
    nid_photo_back_url: 'https://cdn.example.com/nid-back.jpg',
  });

  const [profile] = await db('provider_profiles')
    .insert({ user_id: user.userId, hourly_rate: 500 })
    .returning(['id']);

  // Create a factory-owned test category + skill so the provider has ≥1 skill
  const existingCat = await db('categories').where('slug', '_factory_test').first();
  let categoryId: string;
  if (existingCat) {
    categoryId = existingCat.id as string;
  } else {
    const [cat] = await db('categories')
      .insert({ name: 'Factory Test Service', name_bn: 'ফ্যাক্টরি টেস্ট', slug: '_factory_test', is_active: true })
      .returning(['id']);
    categoryId = cat.id as string;
  }

  await db('provider_skills').insert({ provider_id: profile.id, category_id: categoryId, is_primary: true });

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
