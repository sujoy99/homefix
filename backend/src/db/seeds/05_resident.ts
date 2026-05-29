import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

/**
 * Seeds a demo resident for local testing.
 * Credentials: mobile=01811223344 password=Resident@1234
 * Idempotent: skips if mobile already exists.
 */
export async function seed(knex: Knex): Promise<void> {
  const mobile = '01811223344';

  const exists = await knex('users').where({ mobile }).first();
  if (exists) {
    console.log('[seed] Demo resident already exists — skipping');
    return;
  }

  const passwordHash = await bcrypt.hash('Resident@1234', 12);

  const [user] = await knex('users')
    .insert({
      full_name: 'Fatema Begum',
      mobile,
      nid: '8811223344',
      email: 'fatema@example.com',
      role: 'resident',
      status: 'active',
      area: knex.raw('ST_SetSRID(ST_MakePoint(90.4200, 23.8200), 4326)'),
    })
    .returning(['id']);

  await knex('auth_accounts').insert({
    user_id: user.id,
    auth_method: 'password',
    password_hash: passwordHash,
    refresh_token_version: knex.raw('gen_random_uuid()'),
  });

  console.log(`[seed] Demo resident created — mobile: ${mobile} | password: Resident@1234`);
}
