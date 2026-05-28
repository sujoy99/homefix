import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

/**
 * Seeds the default admin user.
 * Credentials come from environment variables (same ones used by the app).
 * Idempotent: skips if mobile already exists.
 * Run via: make seed
 */
export async function seed(knex: Knex): Promise<void> {
  const mobile   = process.env['DEFAULT_ADMIN_MOBILE'];
  const email    = process.env['DEFAULT_ADMIN_EMAIL'];
  const password = process.env['DEFAULT_ADMIN_PASSWORD'];
  const nid      = process.env['DEFAULT_ADMIN_NID'];

  if (!mobile || !password || !nid) {
    console.warn('[seed] DEFAULT_ADMIN_* env vars not set — skipping admin seed');
    return;
  }

  const exists = await knex('users').where({ mobile }).first();
  if (exists) {
    console.log('[seed] Admin user already exists — skipping');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await knex('users')
    .insert({
      full_name: 'System Admin',
      mobile,
      nid,
      email:    email ?? null,
      role:     'admin',
      status:   'active',
      area:     knex.raw('ST_SetSRID(ST_MakePoint(90.4125, 23.8103), 4326)'),
    })
    .returning(['id']);

  await knex('auth_accounts').insert({
    user_id:               user.id,
    auth_method:           'password',
    password_hash:         passwordHash,
    refresh_token_version: knex.raw('gen_random_uuid()'),
  });

  console.log('[seed] Default admin user created');
}
