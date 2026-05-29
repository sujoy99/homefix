import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

/**
 * Seeds a demo provider with profile and skills for local testing.
 * Credentials: mobile=01711223344 password=Provider@1234
 * Idempotent: skips if mobile already exists.
 */
export async function seed(knex: Knex): Promise<void> {
  const mobile = '01711223344';

  const exists = await knex('users').where({ mobile }).first();
  if (exists) {
    console.log('[seed] Demo provider already exists — skipping');
    return;
  }

  const passwordHash = await bcrypt.hash('Provider@1234', 12);

  const [user] = await knex('users')
    .insert({
      full_name: 'Rahim Uddin',
      mobile,
      nid: '9911223344',
      email: 'rahim@example.com',
      role: 'provider',
      status: 'active',
      area: knex.raw('ST_SetSRID(ST_MakePoint(90.4125, 23.8103), 4326)'),
    })
    .returning(['id']);

  await knex('auth_accounts').insert({
    user_id: user.id,
    auth_method: 'password',
    password_hash: passwordHash,
    refresh_token_version: knex.raw('gen_random_uuid()'),
  });

  const [profile] = await knex('provider_profiles')
    .insert({
      user_id: user.id,
      bio: 'Experienced plumber and electrical technician with 5 years of service in Dhaka.',
      experience_years: 5,
      hourly_rate: 500,
      is_available: true,
      rating_avg: 4.5,
      total_reviews: 12,
    })
    .returning(['id']);

  // Link to first 2 active categories (plumbing + electrical or whatever exists)
  const categories = await knex('categories')
    .where({ is_active: true })
    .orderBy('sort_order')
    .limit(2)
    .select('id');

  for (let i = 0; i < categories.length; i++) {
    await knex('provider_skills').insert({
      provider_id: profile.id,
      category_id: categories[i].id,
      is_primary: i === 0,
    });
  }

  console.log(`[seed] Demo provider created — mobile: ${mobile} | password: Provider@1234`);
}
