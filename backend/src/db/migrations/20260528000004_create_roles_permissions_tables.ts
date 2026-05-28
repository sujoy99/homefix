import type { Knex } from 'knex';

/**
 * Creates 3 tables for DB-driven RBAC:
 *  roles           — the 3 platform roles (seeded)
 *  permissions     — all permission codes (seeded)
 *  role_permissions — junction; admin manages via API
 */
export async function up(knex: Knex): Promise<void> {
  // ── roles ─────────────────────────────────────────────────────────────────
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 20).notNullable().unique();
    table.text('description').nullable();
    table.timestamps(true, true);
  });

  // ── permissions ───────────────────────────────────────────────────────────
  await knex.schema.createTable('permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code', 80).notNullable().unique();
    table.text('description').nullable();
    table.timestamps(true, true);
  });

  // ── role_permissions ──────────────────────────────────────────────────────
  await knex.schema.createTable('role_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.timestamps(true, true);
    table.unique(['role_id', 'permission_id']);
  });

  await knex.raw('CREATE INDEX idx_role_permissions_role_id ON role_permissions (role_id)');

  // ── seed roles ────────────────────────────────────────────────────────────
  const roleRows = await knex('roles')
    .insert([
      { name: 'resident',  description: 'Homeowner or tenant requesting services' },
      { name: 'provider',  description: 'Verified skilled worker offering services' },
      { name: 'admin',     description: 'Platform operator with full access' },
    ])
    .returning(['id', 'name']);

  const roleMap = Object.fromEntries(roleRows.map((r: { id: string; name: string }) => [r.name, r.id])) as Record<string, string>;

  // ── seed permissions ──────────────────────────────────────────────────────
  const permDefs = [
    { code: 'USER_READ',            description: 'Read user profiles' },
    { code: 'USER_WRITE',           description: 'Create or update users' },
    { code: 'ADMIN_DASHBOARD_VIEW', description: 'Access the admin dashboard' },
    { code: 'SETTINGS_MANAGE',      description: 'Manage platform settings' },
    { code: 'JOB_READ',             description: 'View jobs and bookings' },
    { code: 'JOB_WRITE',            description: 'Create and update jobs' },
    { code: 'CATEGORY_READ',        description: 'View all categories including inactive' },
    { code: 'CATEGORY_WRITE',       description: 'Create, update, delete categories' },
    { code: 'PROVIDER_MANAGE',      description: 'Approve, reject, or suspend providers' },
    { code: 'FILE_UPLOAD',          description: 'Upload files through the storage service' },
  ];

  const permRows = await knex('permissions').insert(permDefs).returning(['id', 'code']);
  const permMap = Object.fromEntries(permRows.map((p: { id: string; code: string }) => [p.code, p.id])) as Record<string, string>;

  // ── seed default role_permissions ─────────────────────────────────────────
  const defaults: Array<{ role: string; codes: string[] }> = [
    {
      role: 'admin',
      codes: [
        'USER_READ', 'USER_WRITE', 'ADMIN_DASHBOARD_VIEW', 'SETTINGS_MANAGE',
        'JOB_READ', 'JOB_WRITE', 'CATEGORY_READ', 'CATEGORY_WRITE',
        'PROVIDER_MANAGE', 'FILE_UPLOAD',
      ],
    },
    {
      role: 'provider',
      codes: ['JOB_READ', 'JOB_WRITE', 'FILE_UPLOAD'],
    },
    {
      role: 'resident',
      codes: ['JOB_READ', 'FILE_UPLOAD'],
    },
  ];

  const rolePerm: Array<{ role_id: string; permission_id: string }> = [];
  for (const { role, codes } of defaults) {
    for (const code of codes) {
      rolePerm.push({ role_id: roleMap[role]!, permission_id: permMap[code]! });
    }
  }

  await knex('role_permissions').insert(rolePerm);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_role_permissions_role_id');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
}
