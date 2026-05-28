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
  await db.raw(`
    TRUNCATE TABLE auth_refresh_tokens, auth_accounts, users
    RESTART IDENTITY CASCADE
  `);
}

export async function closeTestDb(): Promise<void> {
  if (_db) {
    await _db.destroy();
    _db = null;
  }
}
