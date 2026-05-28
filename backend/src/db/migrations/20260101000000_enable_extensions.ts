import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS postgis;`);
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
}

export async function down(_knex: Knex): Promise<void> {
  // Extensions are not dropped — geography columns, GiST indexes, and uuid
  // generation all depend on them and cannot be safely removed in isolation.
}
