import { UserRole, UserStatus } from "@modules/users/user.types";
import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  // Ensure uuid generation extension
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  await knex.raw(`
    CREATE SEQUENCE IF NOT EXISTS user_short_code_seq START 1;
  `);

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('short_code', 20)
      .notNullable()
      .unique()
      .defaultTo(knex.raw(`'USR-' || LPAD(nextval('user_short_code_seq')::text, 6, '0')`));
    table.string('full_name').notNullable();
    table
    .string('email', 255)
    .nullable();
    // 11 digit mobile (digits only)
    table.string('mobile', 11).notNullable().unique().checkRegex('^[0-9]{11}$');
    // 10 digit NID (digits only)
    table.string('nid', 10).notNullable().unique().checkRegex('^[0-9]{10}$');
    table
      .enum('role', [UserRole.RESIDENT, UserRole.PROVIDER, UserRole.ADMIN])
      .notNullable()
      .defaultTo(UserRole.RESIDENT);
    table.enum('status', [UserStatus.PENDING, UserStatus.ACTIVE, UserStatus.INACTIVE]).notNullable();
    table.specificType('area', 'GEOGRAPHY(Point, 4326)').nullable(); // GIS column
    table.string('photo_url').nullable(); // User photo
    table.string('nid_photo_url').nullable(); // Provider NID photo
    table.timestamps(true, true); // created_at, updated_at
  });

//   await knex.raw(`
//   CREATE OR REPLACE FUNCTION set_user_status()
//   RETURNS TRIGGER AS $$
//   BEGIN
//     IF NEW.role = 'provider' THEN
//       NEW.status := 'pending';
//     ELSE
//       NEW.status := 'active';
//     END IF;
//     RETURN NEW;
//   END;
//   $$ LANGUAGE plpgsql;
// `);

//   await knex.raw(`
//   CREATE TRIGGER trigger_set_user_status
//   BEFORE INSERT ON users
//   FOR EACH ROW
//   EXECUTE FUNCTION set_user_status();
// `);

  await knex.raw(`
  CREATE INDEX users_area_gist ON users USING GIST (area);
  `);
}


export async function down(knex: Knex): Promise<void> {
  /**
   * 1. Drop table FIRST (removes dependency on sequence)
   */
  await knex.schema.dropTableIfExists('users');

  /**
   * 2. Drop index (safe even if table gone)
   */
  await knex.raw(`DROP INDEX IF EXISTS users_area_gist;`);

  /**
   * 3. Drop sequence AFTER table
   */
  await knex.raw(`DROP SEQUENCE IF EXISTS user_short_code_seq;`);

  /**
   * 4. Drop enums (optional cleanup)
   */
  await knex.raw(`DROP TYPE IF EXISTS user_roles;`);
  await knex.raw(`DROP TYPE IF EXISTS user_status;`);

  /**
   * 5. Drop trigger/function (if used)
   */
  await knex.raw(`DROP TRIGGER IF EXISTS trigger_set_user_status ON users;`);
  await knex.raw(`DROP FUNCTION IF EXISTS set_user_status;`);
}
