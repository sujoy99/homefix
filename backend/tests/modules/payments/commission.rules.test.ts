import { CommissionRuleScope } from '@homefix/shared';
import { request } from '../../helpers/app';
import { truncateAll, closeTestDb, getTestDb } from '../../helpers/db';
import { createAdmin, createUser } from '../../factories/user.factory';
import { createCategory } from '../../factories/category.factory';
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

async function createGlobalRule(token: string, overrides: Record<string, unknown> = {}) {
  return request
    .post('/api/v2/admin/commission/rules')
    .set('Authorization', `Bearer ${token}`)
    .send({ scope: CommissionRuleScope.GLOBAL, rate: 0.2, label: 'Default Rate', ...overrides });
}

// ─── Auth guards ─────────────────────────────────────────────────────────────

describe('Admin Commission Rules API — auth guards', () => {
  it('returns 401 without a token on all endpoints', async () => {
    const [list, create, patch, del, preview] = await Promise.all([
      request.get('/api/v2/admin/commission/rules'),
      request.post('/api/v2/admin/commission/rules').send({}),
      request.patch('/api/v2/admin/commission/rules/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000'),
      request.delete('/api/v2/admin/commission/rules/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000'),
      request.get('/api/v2/admin/commission/preview'),
    ]);
    expect(list.status).toBe(401);
    expect(create.status).toBe(401);
    expect(patch.status).toBe(401);
    expect(del.status).toBe(401);
    expect(preview.status).toBe(401);
  });

  it('returns 403 for resident on all endpoints', async () => {
    const resident = await createUser();
    const token = await loginAs(resident.mobile, resident.password);

    const [list, create] = await Promise.all([
      request.get('/api/v2/admin/commission/rules').set('Authorization', `Bearer ${token}`),
      request.post('/api/v2/admin/commission/rules').set('Authorization', `Bearer ${token}`).send({}),
    ]);
    expect(list.status).toBe(403);
    expect(create.status).toBe(403);
  });
});

// ─── GET /rules — list ───────────────────────────────────────────────────────

describe('GET /api/v2/admin/commission/rules', () => {
  it('returns all rules including inactive', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    await createGlobalRule(token, { label: 'Active Rule' });
    const db = getTestDb();
    const [{ id }] = await db('commission_rules').select('id').where('label', 'Active Rule');
    await db('commission_rules').where('id', id).update({ is_active: false });

    await createGlobalRule(token, { label: 'New Active Rule', rate: 0.15 });

    const res = await request
      .get('/api/v2/admin/commission/rules')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.length).toBeGreaterThanOrEqual(2);
    const labels = res.body.body.map((r: { label: string }) => r.label);
    expect(labels).toContain('Active Rule');
    expect(labels).toContain('New Active Rule');
  });
});

// ─── POST /rules — create ────────────────────────────────────────────────────

describe('POST /api/v2/admin/commission/rules', () => {
  it('creates a global rule and returns 201', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await createGlobalRule(token);

    expect(res.status).toBe(201);
    expect(res.body.body.scope).toBe(CommissionRuleScope.GLOBAL);
    expect(res.body.body.rate).toBe('0.2000');
    expect(res.body.body.is_active).toBe(true);
  });

  it('auto-deactivates previous active global rule when new global rule is created', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    await createGlobalRule(token, { label: 'Old Global', rate: 0.2 });
    await createGlobalRule(token, { label: 'New Global', rate: 0.15 });

    const db = getTestDb();
    const activeGlobals = await db('commission_rules')
      .where('scope', CommissionRuleScope.GLOBAL)
      .where('is_active', true);

    expect(activeGlobals).toHaveLength(1);
    expect(activeGlobals[0].label).toBe('New Global');
  });

  it('creates a category rule with category_id', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const category = await createCategory();

    const res = await request
      .post('/api/v2/admin/commission/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: CommissionRuleScope.CATEGORY,
        rate: 0.15,
        label: 'Plumbing Rate',
        category_id: category.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.body.scope).toBe(CommissionRuleScope.CATEGORY);
    expect(res.body.body.category_id).toBe(category.id);
  });

  it('creates a promotion rule with valid_from and valid_until', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const category = await createCategory();

    const res = await request
      .post('/api/v2/admin/commission/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: CommissionRuleScope.PROMOTION,
        rate: 0.1,
        label: 'Eid Promo',
        category_id: category.id,
        valid_from: '2026-06-01T00:00:00.000Z',
        valid_until: '2026-06-30T23:59:59.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.body.scope).toBe(CommissionRuleScope.PROMOTION);
  });

  it('returns 400 when category rule is missing category_id', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .post('/api/v2/admin/commission/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ scope: CommissionRuleScope.CATEGORY, rate: 0.15, label: 'No Category' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when promotion rule is missing valid_from', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const category = await createCategory();

    const res = await request
      .post('/api/v2/admin/commission/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: CommissionRuleScope.PROMOTION,
        rate: 0.1,
        label: 'Bad Promo',
        category_id: category.id,
        valid_until: '2026-06-30T23:59:59.000Z',
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when rate exceeds 1', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await createGlobalRule(token, { rate: 1.5 });

    expect(res.status).toBe(400);
  });
});

// ─── PATCH /rules/:id — update ───────────────────────────────────────────────

describe('PATCH /api/v2/admin/commission/rules/:id', () => {
  it('updates label and rate', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const created = await createGlobalRule(token);
    const ruleId = created.body.body.id as string;

    const res = await request
      .patch(`/api/v2/admin/commission/rules/${ruleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Updated Label', rate: 0.25 });

    expect(res.status).toBe(200);
    expect(res.body.body.label).toBe('Updated Label');
    expect(res.body.body.rate).toBe('0.2500');
  });

  it('returns 404 for a non-existent rule', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .patch('/api/v2/admin/commission/rules/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000')
      .set('Authorization', `Bearer ${token}`)
      .send({ rate: 0.1 });

    expect(res.status).toBe(404);
  });

  it('returns 400 when rate is out of range', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const created = await createGlobalRule(token);
    const ruleId = created.body.body.id as string;

    const res = await request
      .patch(`/api/v2/admin/commission/rules/${ruleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rate: 2 });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /rules/:id — soft-deactivate ─────────────────────────────────────

describe('DELETE /api/v2/admin/commission/rules/:id', () => {
  it('soft-deactivates a rule without removing it from DB', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const created = await createGlobalRule(token);
    const ruleId = created.body.body.id as string;

    const res = await request
      .delete(`/api/v2/admin/commission/rules/${ruleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const db = getTestDb();
    const [row] = await db('commission_rules').where('id', ruleId);
    expect(row.is_active).toBe(false);
  });

  it('returns 404 for a non-existent rule', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .delete('/api/v2/admin/commission/rules/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 when rule is already inactive', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const created = await createGlobalRule(token);
    const ruleId = created.body.body.id as string;

    await request
      .delete(`/api/v2/admin/commission/rules/${ruleId}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request
      .delete(`/api/v2/admin/commission/rules/${ruleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// ─── GET /preview — resolution ───────────────────────────────────────────────

describe('GET /api/v2/admin/commission/preview', () => {
  it('returns the active global rule when no category matches', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    await createGlobalRule(token, { rate: 0.2, label: 'Default Rate' });

    const res = await request
      .get('/api/v2/admin/commission/preview')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.body.rate)).toBeCloseTo(0.2);
    expect(res.body.body.label).toBe('Default Rate');
  });

  it('returns the category rule when category_id matches', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const category = await createCategory();

    await createGlobalRule(token, { rate: 0.2 });
    await request
      .post('/api/v2/admin/commission/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: CommissionRuleScope.CATEGORY,
        rate: 0.15,
        label: 'Category Override',
        category_id: category.id,
      });

    const res = await request
      .get(`/api/v2/admin/commission/preview?category_id=${category.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.body.rate)).toBeCloseTo(0.15);
  });

  it('returns the promotion rule when it is active for the given date', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);
    const category = await createCategory();

    await createGlobalRule(token, { rate: 0.2 });
    await request
      .post('/api/v2/admin/commission/rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: CommissionRuleScope.PROMOTION,
        rate: 0.05,
        label: 'Flash Promo',
        category_id: category.id,
        valid_from: '2026-06-01T00:00:00.000Z',
        valid_until: '2026-06-30T23:59:59.000Z',
      });

    const res = await request
      .get(
        `/api/v2/admin/commission/preview?category_id=${category.id}&date=2026-06-15T12:00:00.000Z`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.body.rate)).toBeCloseTo(0.05);
    expect(res.body.body.label).toBe('Flash Promo');
  });

  it('returns 404 when no active rule exists', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .get('/api/v2/admin/commission/preview')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
