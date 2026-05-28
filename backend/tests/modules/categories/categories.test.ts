import { request } from '../../helpers/app';
import { truncateAll, closeTestDb } from '../../helpers/db';
import { createAdmin, createUser } from '../../factories/user.factory';
import { createCategory } from '../../factories/category.factory';
import { UserRole } from '../../../src/modules/users/user.types';
import { AuthMethod } from '../../../src/modules/auth/auth.types';

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

// ─── Public: list active categories ────────────────────────────────────────

describe('GET /api/v2/categories', () => {
  it('returns only active categories (public)', async () => {
    await createCategory({ name: 'Plumbing', slug: 'plumbing', is_active: true });
    await createCategory({ name: 'Painting', slug: 'painting', is_active: false });

    const res = await request.get('/api/v2/categories');

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(1);
    expect(res.body.body[0].slug).toBe('plumbing');
  });

  it('returns empty array when no active categories', async () => {
    const res = await request.get('/api/v2/categories');
    expect(res.status).toBe(200);
    expect(res.body.body).toEqual([]);
  });
});

// ─── GET /all — admin only ─────────────────────────────────────────────────

describe('GET /api/v2/categories/all', () => {
  it('returns all categories including inactive for admin', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    await createCategory({ slug: 'plumbing', is_active: true });
    await createCategory({ slug: 'painting', is_active: false });

    const res = await request
      .get('/api/v2/categories/all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(2);
  });

  it('returns 403 for resident trying to list all', async () => {
    const resident = await createUser();
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .get('/api/v2/categories/all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/v2/categories/all');
    expect(res.status).toBe(401);
  });
});

// ─── GET /:id ──────────────────────────────────────────────────────────────

describe('GET /api/v2/categories/:id', () => {
  it('returns category by ID', async () => {
    const cat = await createCategory({ slug: 'electrical' });

    const res = await request.get(`/api/v2/categories/${cat.id}`);

    expect(res.status).toBe(200);
    expect(res.body.body.slug).toBe('electrical');
  });

  it('returns 404 for non-existent ID', async () => {
    const res = await request.get('/api/v2/categories/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid UUID', async () => {
    const res = await request.get('/api/v2/categories/not-a-uuid');
    expect(res.status).toBe(400);
  });
});

// ─── POST / — admin creates category ──────────────────────────────────────

describe('POST /api/v2/categories', () => {
  it('admin creates a category successfully', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Plumbing',
        slug: 'plumbing',
        description: 'Water pipe repairs',
        requires_area: false,
        sort_order: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.body).toMatchObject({
      name: 'Plumbing',
      slug: 'plumbing',
      requires_area: false,
    });
  });

  it('creates a category with requires_area=true (e.g. Painting)', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Painting', slug: 'painting', requires_area: true });

    expect(res.status).toBe(201);
    expect(res.body.body.requires_area).toBe(true);
  });

  it('returns 409 for duplicate slug', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    await createCategory({ slug: 'plumbing' });

    const res = await request
      .post('/api/v2/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Plumbing 2', slug: 'plumbing' });

    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid slug format', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad', slug: 'Invalid Slug!' });

    expect(res.status).toBe(400);
  });

  it('returns 403 for non-admin', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .post('/api/v2/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Plumbing', slug: 'plumbing' });

    expect(res.status).toBe(403);
  });
});

// ─── PATCH /:id ────────────────────────────────────────────────────────────

describe('PATCH /api/v2/categories/:id', () => {
  it('admin updates a category', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const cat = await createCategory({ slug: 'electrical', is_active: true });

    const res = await request
      .patch(`/api/v2/categories/${cat.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_active: false });

    expect(res.status).toBe(200);
    expect(res.body.body.is_active).toBe(false);
  });

  it('returns 404 for non-existent category', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .patch('/api/v2/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /:id ───────────────────────────────────────────────────────────

describe('DELETE /api/v2/categories/:id', () => {
  it('admin deletes a category', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const cat = await createCategory({ slug: 'carpentry' });

    const res = await request
      .delete(`/api/v2/categories/${cat.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const check = await request.get(`/api/v2/categories/${cat.id}`);
    expect(check.status).toBe(404);
  });

  it('returns 404 when deleting non-existent category', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .delete('/api/v2/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
