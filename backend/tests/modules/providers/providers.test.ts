import { request } from '../../helpers/app';
import { truncateAll, closeTestDb } from '../../helpers/db';
import { createProvider } from '../../factories/provider.factory';
import { createUser } from '../../factories/user.factory';
import { createCategory } from '../../factories/category.factory';
import { addSkillToProvider } from '../../factories/provider.factory';
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

// ─── GET /providers/available ─────────────────────────────────────────────

describe('GET /api/v2/providers/available', () => {
  it('returns available providers (public)', async () => {
    await createProvider({ status: UserStatus.ACTIVE });
    await createProvider({ status: UserStatus.ACTIVE });

    const res = await request.get('/api/v2/providers/available');

    expect(res.status).toBe(200);
    expect(res.body.body.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── GET /providers/:user_id ──────────────────────────────────────────────

describe('GET /api/v2/providers/:user_id', () => {
  it('returns a provider profile by user ID', async () => {
    const provider = await createProvider();

    const res = await request.get(`/api/v2/providers/${provider.userId}`);

    expect(res.status).toBe(200);
    expect(res.body.body.user_id).toBe(provider.userId);
    expect(Array.isArray(res.body.body.skills)).toBe(true);
  });

  it('returns 404 for user with no provider profile', async () => {
    const user = await createUser({ role: UserRole.RESIDENT });

    const res = await request.get(`/api/v2/providers/${user.userId}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid UUID', async () => {
    const res = await request.get('/api/v2/providers/not-a-uuid');
    expect(res.status).toBe(400);
  });
});

// ─── GET /providers/me/profile ────────────────────────────────────────────

describe('GET /api/v2/providers/me/profile', () => {
  it('provider gets or creates their own profile', async () => {
    const provider = await createProvider();
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .get('/api/v2/providers/me/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.user_id).toBe(provider.userId);
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/v2/providers/me/profile');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a resident trying to get provider profile', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .get('/api/v2/providers/me/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /providers/me/profile ─────────────────────────────────────────

describe('PATCH /api/v2/providers/me/profile', () => {
  it('provider updates their profile', async () => {
    const provider = await createProvider();
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .patch('/api/v2/providers/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bio: 'Experienced plumber with 10 years in Dhaka',
        experience_years: 10,
        hourly_rate: 500,
        is_available: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.body.experience_years).toBe(10);
    expect(res.body.body.is_available).toBe(true);
  });

  it('toggles availability to false', async () => {
    const provider = await createProvider();
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .patch('/api/v2/providers/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ is_available: false });

    expect(res.status).toBe(200);
    expect(res.body.body.is_available).toBe(false);
  });

  it('returns 400 for invalid experience_years', async () => {
    const provider = await createProvider();
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .patch('/api/v2/providers/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ experience_years: -5 });

    expect(res.status).toBe(400);
  });
});

// ─── POST /providers/me/skills ────────────────────────────────────────────

describe('POST /api/v2/providers/me/skills', () => {
  it('provider adds a skill', async () => {
    const provider = await createProvider();
    const category = await createCategory({ slug: 'plumbing' });
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .post('/api/v2/providers/me/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: category.id, is_primary: true });

    expect(res.status).toBe(201);
    const skills = res.body.body.skills as Array<{ category_id: string; is_primary: boolean }>;
    expect(skills.some((s) => s.category_id === category.id && s.is_primary)).toBe(true);
  });

  it('returns 409 for duplicate skill', async () => {
    const provider = await createProvider();
    const category = await createCategory({ slug: 'electrical' });
    await addSkillToProvider(provider.profileId, category.id);
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .post('/api/v2/providers/me/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: category.id });

    expect(res.status).toBe(409);
  });

  it('returns 404 for non-existent category', async () => {
    const provider = await createProvider();
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .post('/api/v2/providers/me/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid category UUID', async () => {
    const provider = await createProvider();
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .post('/api/v2/providers/me/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({ category_id: 'not-a-uuid' });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /providers/me/skills/:skill_id ────────────────────────────────

describe('DELETE /api/v2/providers/me/skills/:skill_id', () => {
  it('provider removes a skill', async () => {
    const provider = await createProvider();
    const category = await createCategory({ slug: 'carpentry' });
    const skillId = await addSkillToProvider(provider.profileId, category.id);
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .delete(`/api/v2/providers/me/skills/${skillId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent skill', async () => {
    const provider = await createProvider();
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .delete('/api/v2/providers/me/skills/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 if skill belongs to another provider', async () => {
    const provider1 = await createProvider();
    const provider2 = await createProvider();
    const category = await createCategory({ slug: 'painting' });
    const skillId = await addSkillToProvider(provider2.profileId, category.id);
    const token = await loginAs(provider1.mobile, provider1.password);

    const res = await request
      .delete(`/api/v2/providers/me/skills/${skillId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
