import type { Knex } from 'knex';

/**
 * Seeds platform roles, permission codes, and default role→permission assignments.
 * Idempotent: uses INSERT ... ON CONFLICT DO NOTHING throughout.
 * Run via: make seed
 */

const ROLES = [
  { name: 'resident',  description: 'Homeowner or tenant requesting services' },
  { name: 'provider',  description: 'Verified skilled worker offering services' },
  { name: 'admin',     description: 'Platform operator with full access' },
];

const PERMISSIONS = [
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

const DEFAULT_ASSIGNMENTS: Record<string, string[]> = {
  admin: [
    'USER_READ', 'USER_WRITE', 'ADMIN_DASHBOARD_VIEW', 'SETTINGS_MANAGE',
    'JOB_READ', 'JOB_WRITE', 'CATEGORY_READ', 'CATEGORY_WRITE',
    'PROVIDER_MANAGE', 'FILE_UPLOAD',
  ],
  provider: ['JOB_READ', 'JOB_WRITE', 'FILE_UPLOAD'],
  resident: ['JOB_READ', 'FILE_UPLOAD'],
};

export async function seed(knex: Knex): Promise<void> {
  // Roles
  await knex('roles')
    .insert(ROLES)
    .onConflict('name')
    .ignore();

  // Permissions
  await knex('permissions')
    .insert(PERMISSIONS)
    .onConflict('code')
    .ignore();

  // Fetch IDs (rows may have existed before this seed ran)
  const roleRows  = await knex('roles').select('id', 'name') as Array<{ id: string; name: string }>;
  const permRows  = await knex('permissions').select('id', 'code') as Array<{ id: string; code: string }>;

  const roleMap = Object.fromEntries(roleRows.map((r) => [r.name, r.id])) as Record<string, string>;
  const permMap = Object.fromEntries(permRows.map((p) => [p.code, p.id])) as Record<string, string>;

  // Role → permission assignments
  const assignments = Object.entries(DEFAULT_ASSIGNMENTS).flatMap(([role, codes]) =>
    codes.map((code) => ({ role_id: roleMap[role]!, permission_id: permMap[code]! }))
  );

  await knex('role_permissions')
    .insert(assignments)
    .onConflict(['role_id', 'permission_id'])
    .ignore();

  console.log('[seed] roles, permissions, role_permissions — done');
}
