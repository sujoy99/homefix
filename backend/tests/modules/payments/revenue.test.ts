import { request } from '../../helpers/app';
import { truncateAll, closeTestDb, getTestDb } from '../../helpers/db';
import { createAdmin, createUser } from '../../factories/user.factory';
import { createCategory } from '../../factories/category.factory';
import { createJob } from '../../factories/job.factory';
import { createProvider } from '../../factories/provider.factory';
import { AuthMethod } from '../../../src/modules/auth/auth.types';
import { UserStatus } from '../../../src/modules/users/user.types';
import { JobStatus } from '@homefix/shared';

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

// Timestamps well apart so period grouping is deterministic
const JAN = '2026-01-15T10:00:00.000Z';
const FEB = '2026-02-15T10:00:00.000Z';

interface SeedResult {
  adminId: string;
  adminToken: string;
  ruleId: string;
  categoryId: string;
  categoryName: string;
  payment1Id: string;
  payment2Id: string;
  ledger1Id: string;
  ledger2Id: string;
}

async function seedRevenueData(): Promise<SeedResult> {
  const db = getTestDb();

  const admin = await createAdmin();
  const adminToken = await loginAs(admin.mobile, admin.password);
  const provider = await createProvider({ status: UserStatus.ACTIVE });
  const resident = await createUser();
  const cat = await createCategory({ name: 'Plumbing', slug: 'plumbing' });

  const [rule] = await db('commission_rules')
    .insert({
      scope: 'global',
      rate: '0.2000',
      label: 'Default 20%',
      is_active: true,
      created_by_admin_id: admin.userId,
    })
    .returning(['id']);

  // Two separate jobs (payments.job_id is unique)
  const job1 = await createJob({
    resident_id: resident.userId,
    category_id: cat.id,
    provider_id: provider.userId,
    status: JobStatus.PAID,
  });
  const job2 = await createJob({
    resident_id: resident.userId,
    category_id: cat.id,
    provider_id: provider.userId,
    status: JobStatus.PAID,
  });

  // Payment 1: ৳100 job, ৳20 platform fee
  const [payment1] = await db('payments')
    .insert({
      job_id: job1.id,
      resident_id: resident.userId,
      provider_id: provider.userId,
      amount_paisa: 10_000,
      commission_rate: '0.2000',
      commission_rule_id: rule.id,
      platform_fee_paisa: 2_000,
      provider_net_paisa: 8_000,
      method: 'bkash',
      transaction_id: 'TXNABC12345',
      status: 'verified',
      verified_by_admin_id: admin.userId,
      verified_at: new Date(JAN),
    })
    .returning(['id']);

  // Payment 2: ৳150 job, ৳30 platform fee
  const [payment2] = await db('payments')
    .insert({
      job_id: job2.id,
      resident_id: resident.userId,
      provider_id: provider.userId,
      amount_paisa: 15_000,
      commission_rate: '0.2000',
      commission_rule_id: rule.id,
      platform_fee_paisa: 3_000,
      provider_net_paisa: 12_000,
      method: 'nagad',
      transaction_id: 'TXNDEF67890',
      status: 'verified',
      verified_by_admin_id: admin.userId,
      verified_at: new Date(FEB),
    })
    .returning(['id']);

  // Ledger entries with explicit timestamps for period grouping tests
  const [ledger1] = await db('platform_revenue_ledger')
    .insert({ payment_id: payment1.id, commission_rule_id: rule.id, amount_paisa: 2_000, created_at: new Date(JAN) })
    .returning(['id']);

  const [ledger2] = await db('platform_revenue_ledger')
    .insert({ payment_id: payment2.id, commission_rule_id: rule.id, amount_paisa: 3_000, created_at: new Date(FEB) })
    .returning(['id']);

  return {
    adminId: admin.userId,
    adminToken,
    ruleId: rule.id as string,
    categoryId: cat.id,
    categoryName: cat.name,
    payment1Id: payment1.id as string,
    payment2Id: payment2.id as string,
    ledger1Id: ledger1.id as string,
    ledger2Id: ledger2.id as string,
  };
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

describe('Admin Revenue API — auth guards', () => {
  it('returns 401 without a token', async () => {
    const [dashboard, jobs] = await Promise.all([
      request.get('/api/v2/admin/revenue'),
      request.get('/api/v2/admin/revenue/jobs'),
    ]);
    expect(dashboard.status).toBe(401);
    expect(jobs.status).toBe(401);
  });

  it('returns 403 for a resident', async () => {
    const resident = await createUser();
    const token = await loginAs(resident.mobile, resident.password);

    const [dashboard, jobs] = await Promise.all([
      request.get('/api/v2/admin/revenue').set('Authorization', `Bearer ${token}`),
      request.get('/api/v2/admin/revenue/jobs').set('Authorization', `Bearer ${token}`),
    ]);
    expect(dashboard.status).toBe(403);
    expect(jobs.status).toBe(403);
  });
});

// ─── GET /admin/revenue — empty state ─────────────────────────────────────────

describe('GET /api/v2/admin/revenue — empty state', () => {
  it('returns zeros when no revenue has been recorded', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin.mobile, admin.password);

    const res = await request
      .get('/api/v2/admin/revenue')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.total_revenue_paisa).toBe(0);
    expect(res.body.body.revenue_by_period).toHaveLength(0);
    expect(res.body.body.breakdown_by_rule).toHaveLength(0);
    expect(res.body.body.top_categories).toHaveLength(0);
  });
});

// ─── GET /admin/revenue — aggregation ─────────────────────────────────────────

describe('GET /api/v2/admin/revenue — aggregation', () => {
  it('returns correct all-time total', async () => {
    const { adminToken } = await seedRevenueData();

    const res = await request
      .get('/api/v2/admin/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.body.total_revenue_paisa).toBe(5_000); // 2000 + 3000
  });

  it('groups by month with period=monthly (default)', async () => {
    const { adminToken } = await seedRevenueData();

    const res = await request
      .get('/api/v2/admin/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    const periods = res.body.body.revenue_by_period as Array<{ date: string; total_paisa: number }>;
    expect(periods).toHaveLength(2);
    expect(periods[0]!.date).toBe('2026-01');
    expect(periods[0]!.total_paisa).toBe(2_000);
    expect(periods[1]!.date).toBe('2026-02');
    expect(periods[1]!.total_paisa).toBe(3_000);
  });

  it('groups by day with period=daily', async () => {
    const { adminToken } = await seedRevenueData();

    const res = await request
      .get('/api/v2/admin/revenue?period=daily')
      .set('Authorization', `Bearer ${adminToken}`);

    const periods = res.body.body.revenue_by_period as Array<{ date: string; total_paisa: number }>;
    expect(periods).toHaveLength(2);
    expect(periods[0]!.date).toBe('2026-01-15');
    expect(periods[1]!.date).toBe('2026-02-15');
  });

  it('filters by from/to date range', async () => {
    const { adminToken } = await seedRevenueData();

    // Only the February entry should appear
    const res = await request
      .get('/api/v2/admin/revenue?from=2026-02-01T00:00:00Z&to=2026-02-28T23:59:59Z')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.body.total_revenue_paisa).toBe(3_000);
    expect(res.body.body.revenue_by_period).toHaveLength(1);
    expect(res.body.body.revenue_by_period[0].date).toBe('2026-02');
  });

  it('shows per-rule breakdown with correct totals', async () => {
    const { adminToken, ruleId } = await seedRevenueData();

    const res = await request
      .get('/api/v2/admin/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    const breakdown = res.body.body.breakdown_by_rule as Array<{
      rule_id: string; label: string; scope: string; rate: string; total_paisa: number;
    }>;
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]!.rule_id).toBe(ruleId);
    expect(breakdown[0]!.label).toBe('Default 20%');
    expect(breakdown[0]!.scope).toBe('global');
    expect(breakdown[0]!.total_paisa).toBe(5_000);
  });

  it('shows top categories sorted by revenue', async () => {
    const { adminToken, categoryId, categoryName } = await seedRevenueData();

    const res = await request
      .get('/api/v2/admin/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    const top = res.body.body.top_categories as Array<{
      category_id: string; name: string; slug: string; total_paisa: number;
    }>;
    expect(top).toHaveLength(1);
    expect(top[0]!.category_id).toBe(categoryId);
    expect(top[0]!.name).toBe(categoryName);
    expect(top[0]!.total_paisa).toBe(5_000);
  });
});

// ─── GET /admin/revenue/jobs — per-job detail ─────────────────────────────────

describe('GET /api/v2/admin/revenue/jobs — per-job detail', () => {
  it('returns per-job rows with correct fields', async () => {
    const { adminToken, payment1Id, payment2Id } = await seedRevenueData();

    const res = await request
      .get('/api/v2/admin/revenue/jobs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const { items, nextCursor } = res.body.body as {
      items: Array<{ payment_id: string; revenue_paisa: number; method: string; rule_label: string }>;
      nextCursor: string | null;
    };

    expect(items).toHaveLength(2);
    expect(nextCursor).toBeNull();

    // Ordered by created_at DESC — Feb entry first
    expect(items[0]!.payment_id).toBe(payment2Id);
    expect(items[0]!.revenue_paisa).toBe(3_000);
    expect(items[0]!.method).toBe('nagad');
    expect(items[0]!.rule_label).toBe('Default 20%');

    expect(items[1]!.payment_id).toBe(payment1Id);
    expect(items[1]!.revenue_paisa).toBe(2_000);
    expect(items[1]!.method).toBe('bkash');
  });

  it('paginates correctly with limit and cursor', async () => {
    const { adminToken, payment1Id, payment2Id } = await seedRevenueData();

    // Page 1 — limit=1 should return Feb entry + nextCursor
    const page1 = await request
      .get('/api/v2/admin/revenue/jobs?limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(page1.status).toBe(200);
    expect(page1.body.body.items).toHaveLength(1);
    expect((page1.body.body.items as Array<{ payment_id: string }>)[0]!.payment_id).toBe(payment2Id);
    const cursor = page1.body.body.nextCursor as string;
    expect(cursor).toBeTruthy();

    // Page 2 — use cursor to get Jan entry
    const page2 = await request
      .get(`/api/v2/admin/revenue/jobs?limit=1&cursor=${encodeURIComponent(cursor)}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(page2.status).toBe(200);
    expect(page2.body.body.items).toHaveLength(1);
    expect((page2.body.body.items as Array<{ payment_id: string }>)[0]!.payment_id).toBe(payment1Id);
    expect(page2.body.body.nextCursor).toBeNull();
  });
});
