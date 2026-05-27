import * as dotenv from 'dotenv';
import path from 'path';
import knex from 'knex';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

export default async function globalTeardown() {
  const dbName = process.env['DB_NAME']!;
  const adminDb = knex({
    client: 'pg',
    connection: {
      host: process.env['DB_HOST']!,
      port: Number(process.env['DB_PORT']!),
      database: 'postgres',
      user: process.env['DB_USER']!,
      password: process.env['DB_PASSWORD']!,
    },
  });
  await adminDb.raw(`DROP DATABASE IF EXISTS ?? WITH (FORCE)`, [dbName]);
  await adminDb.destroy();
}
