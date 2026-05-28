import { request } from '../../helpers/app';
import { truncateAll, closeTestDb } from '../../helpers/db';
import { createAdmin, createUser } from '../../factories/user.factory';
import { AuthMethod } from '../../../src/modules/auth/auth.types';
import { permissionCache } from '../../../src/modules/auth/permission.cache';

afterEach(async () => {
  await truncateAll();
  // Re-sync cache after truncate (users gone but role_permissions unchanged)
  await permissionCache.refresh();
});

afterAll(async () => {
  await closeTestDb();
});

async function loginAs(mobile: string, password: string): Promise<string> {
  const res = await request.post('/api/v2/auth/login').send({
    method: AuthMethod.PASSWORD,
    mobile,
    password,
    deviceId: 'test-device',
  });
  return res.body.body.tokens.accessToken as string;
}

// ─── GET /admin/rbac/roles ────────────────────────────────────────────────

describe('GET /api/v2/admin/rbac/roles', () => {
  it('admin gets all roles with permissions', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .get('/api/v2/admin/rbac/roles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.body)).toBe(true);
    expect(res.body.body.length).toBe(3);

    const adminRole = res.body.body.find((r: { name: string }) => r.name === 'admin');
    expect(adminRole).toBeDefined();
    expect(adminRole.permissions).toContain('SETTINGS_MANAGE');
  });

  it('returns 403 for non-admin', async () => {
    const user = await createUser();
    const token = await loginAs(user.mobile, user.password);

    const res = await request
      .get('/api/v2/admin/rbac/roles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── GET /admin/rbac/permissions ──────────────────────────────────────────

describe('GET /api/v2/admin/rbac/permissions', () => {
  it('admin lists all available permissions', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .get('/api/v2/admin/rbac/permissions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.body)).toBe(true);
    const codes = res.body.body.map((p: { code: string }) => p.code);
    expect(codes).toContain('JOB_READ');
    expect(codes).toContain('CATEGORY_WRITE');
  });
});

// ─── POST /admin/rbac/roles/:role/permissions ─────────────────────────────

describe('POST /api/v2/admin/rbac/roles/:role/permissions', () => {
  it('admin assigns a permission to resident role', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/admin/rbac/roles/resident/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ permission_code: 'USER_READ' });

    expect(res.status).toBe(200);

    // Verify cache updated
    const { permissionCache: pc } = await import('../../../src/modules/auth/permission.cache');
    const perms = pc.get('resident' as any);
    expect(perms).toContain('USER_READ');
  });

  it('returns 400 for invalid role', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/admin/rbac/roles/superuser/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ permission_code: 'JOB_READ' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid permission code', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/admin/rbac/roles/resident/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ permission_code: 'MADE_UP_PERMISSION' });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /admin/rbac/roles/:role/permissions/:code ─────────────────────

describe('DELETE /api/v2/admin/rbac/roles/:role/permissions/:code', () => {
  it('admin revokes a permission from provider', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .delete('/api/v2/admin/rbac/roles/provider/permissions/FILE_UPLOAD')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const { permissionCache: pc } = await import('../../../src/modules/auth/permission.cache');
    const perms = pc.get('provider' as any);
    expect(perms).not.toContain('FILE_UPLOAD');
  });

  it('returns 404 when revoking non-existent mapping', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .delete('/api/v2/admin/rbac/roles/resident/permissions/SETTINGS_MANAGE')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /admin/rbac/refresh ─────────────────────────────────────────────

describe('POST /api/v2/admin/rbac/refresh', () => {
  it('admin can force-refresh the permission cache', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/admin/rbac/refresh')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
