import { request } from '../../helpers/app';
import { truncateAll, closeTestDb } from '../../helpers/db';
import { createAdmin, createUser } from '../../factories/user.factory';
import { AuthMethod } from '../../../src/modules/auth/auth.types';
import { UserRole, UserStatus } from '../../../src/modules/users/user.types';

afterEach(async () => {
  await truncateAll();
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

// ─── GET /admin/providers/pending ─────────────────────────────────────────

describe('GET /api/v2/admin/providers/pending', () => {
  it('admin lists pending providers', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    // Create 2 pending providers and 1 active resident
    await createUser({ role: UserRole.PROVIDER, status: UserStatus.PENDING });
    await createUser({ role: UserRole.PROVIDER, status: UserStatus.PENDING });
    await createUser({ role: UserRole.RESIDENT, status: UserStatus.ACTIVE });

    const res = await request
      .get('/api/v2/admin/providers/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(2);
    expect(res.body.body[0].role).toBe(UserRole.PROVIDER);
    expect(res.body.body[0].status).toBe(UserStatus.PENDING);
  });

  it('returns empty array when no pending providers', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .get('/api/v2/admin/providers/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(0);
  });

  it('returns 403 for non-admin', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .get('/api/v2/admin/providers/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/v2/admin/providers/pending');
    expect(res.status).toBe(401);
  });
});

// ─── POST /admin/providers/:id/approve ────────────────────────────────────

describe('POST /api/v2/admin/providers/:id/approve', () => {
  it('admin approves a pending provider', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.PENDING });

    const res = await request
      .post(`/api/v2/admin/providers/${provider.userId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.status).toBe(UserStatus.ACTIVE);
    expect(res.body.body.id).toBe(provider.userId);
  });

  it('returns 400 when approving already active provider', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });

    const res = await request
      .post(`/api/v2/admin/providers/${provider.userId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 400 when approving a resident (not a provider)', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const resident = await createUser({ role: UserRole.RESIDENT });

    const res = await request
      .post(`/api/v2/admin/providers/${resident.userId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent user', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/admin/providers/00000000-0000-0000-0000-000000000000/approve')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid UUID', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/admin/providers/not-a-uuid/approve')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// ─── POST /admin/providers/:id/reject ─────────────────────────────────────

describe('POST /api/v2/admin/providers/:id/reject', () => {
  it('admin rejects a pending provider', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.PENDING });

    const res = await request
      .post(`/api/v2/admin/providers/${provider.userId}/reject`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.status).toBe(UserStatus.INACTIVE);
  });

  it('returns 400 when rejecting an already rejected provider', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.INACTIVE });

    const res = await request
      .post(`/api/v2/admin/providers/${provider.userId}/reject`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 403 for provider trying to reject another provider', async () => {
    const provider1 = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const provider2 = await createUser({ role: UserRole.PROVIDER, status: UserStatus.PENDING });
    const token = await loginAs(provider1.mobile, provider1.password);

    const res = await request
      .post(`/api/v2/admin/providers/${provider2.userId}/reject`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
