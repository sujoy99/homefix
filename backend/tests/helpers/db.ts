import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

let _db: Knex | null = null;

export function getTestDb(): Knex {
  if (!_db) {
    _db = knex({
      client: 'pg',
      connection: {
        host: process.env['DB_HOST']!,
        port: Number(process.env['DB_PORT']!),
        database: process.env['DB_NAME']!,
        user: process.env['DB_USER']!,
        password: process.env['DB_PASSWORD']!,
      },
    });
  }
  return _db;
}

export async function truncateAll(): Promise<void> {
  const db = getTestDb();
  // DELETE instead of TRUNCATE to avoid ACCESS EXCLUSIVE locks that
  // kill the app's connection pool (especially with PostGIS generated columns)
  await db.raw(`DELETE FROM job_messages`);
  await db.raw(`DELETE FROM wallet_transactions`);
  await db.raw(`DELETE FROM platform_revenue_ledger`);
  await db.raw(`DELETE FROM withdrawal_requests`);
  await db.raw(`DELETE FROM wallets`);
  await db.raw(`DELETE FROM payments`);
  await db.raw(`DELETE FROM provider_payment_accounts`);
  await db.raw(`DELETE FROM commission_rules`);
  await db.raw(`DELETE FROM notifications`);
  await db.raw(`DELETE FROM device_tokens`);
  await db.raw(`DELETE FROM reviews`);
  await db.raw(`DELETE FROM jobs`);
  await db.raw(`DELETE FROM provider_skills`);
  await db.raw(`DELETE FROM provider_profiles`);
  await db.raw(`DELETE FROM auth_refresh_tokens`);
  await db.raw(`DELETE FROM auth_accounts`);
  await db.raw(`DELETE FROM users`);
  await db.raw(`DELETE FROM categories`);
}

export async function closeTestDb(): Promise<void> {
  if (_db) {
    await _db.destroy();
    _db = null;
  }
}
