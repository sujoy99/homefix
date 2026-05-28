import * as dotenv from 'dotenv';
import path from 'path';
import knex from 'knex';
// Register path aliases so migration files (which import @modules/...) resolve correctly
import 'tsconfig-paths/register';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

function conn(database: string) {
  return {
    host: process.env['DB_HOST']!,
    port: Number(process.env['DB_PORT']!),
    database,
    user: process.env['DB_USER']!,
    password: process.env['DB_PASSWORD']!,
  };
}

export default async function globalSetup() {
  const dbName = process.env['DB_NAME']!;

  // 1. Create test DB if it doesn't exist
  const adminDb = knex({ client: 'pg', connection: conn('postgres') });
  const { rows } = await adminDb.raw<{ rows: unknown[] }>(
    `SELECT 1 FROM pg_database WHERE datname = ?`,
    [dbName]
  );
  if (rows.length === 0) {
    await adminDb.raw(`CREATE DATABASE ??`, [dbName]);
  }
  await adminDb.destroy();

  // 2. Enable PostGIS and run migrations on test DB
  const testDb = knex({
    client: 'pg',
    connection: conn(dbName),
    migrations: {
      directory: path.resolve(__dirname, '../src/db/migrations'),
      extension: 'ts',
    },
  });
  await testDb.raw(`CREATE EXTENSION IF NOT EXISTS postgis`);
  await testDb.migrate.latest();
  await testDb.destroy();
}
