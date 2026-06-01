import { JobStatus } from '@homefix/shared';
import { request } from '../../helpers/app';
import { truncateAll, closeTestDb, getTestDb } from '../../helpers/db';
import { createUser } from '../../factories/user.factory';
import { createCategory } from '../../factories/category.factory';
import { createJob } from '../../factories/job.factory';
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

async function submitReview(
  token: string,
  jobId: string,
  body: Record<string, unknown> = { rating: 5 }
) {
  return request
    .post(`/api/v2/jobs/${jobId}/review`)
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}

// ─── Auth guards ───────────────────────────────────────────────────────────────

describe('Reviews API — auth guards', () => {
  it('returns 401 when submitting review without token', async () => {
    const category = await createCategory();
    const resident = await createUser();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });

    const res = await request
      .post(`/api/v2/jobs/${job.id}/review`)
      .send({ rating: 5 });

    expect(res.status).toBe(401);
  });

  it('returns 403 when a provider tries to submit a review', async () => {
    const category = await createCategory();
    const resident = await createUser();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });
    const providerToken = await loginAs(provider.mobile, provider.password);

    const res = await submitReview(providerToken, job.id);

    expect(res.status).toBe(403);
  });
});

// ─── POST /jobs/:jobId/review ──────────────────────────────────────────────────

describe('POST /api/v2/jobs/:jobId/review', () => {
  it('returns 404 when job does not exist', async () => {
    const resident = await createUser();
    const token = await loginAs(resident.mobile, resident.password);

    const res = await submitReview(token, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000');

    expect(res.status).toBe(404);
  });

  it('returns 403 when resident does not own the job', async () => {
    const category = await createCategory();
    const owner = await createUser();
    const other = await createUser();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const job = await createJob({
      resident_id: owner.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });
    const otherToken = await loginAs(other.mobile, other.password);

    const res = await submitReview(otherToken, job.id);

    expect(res.status).toBe(403);
  });

  it('returns 400 when job is not in PAID status', async () => {
    const category = await createCategory();
    const resident = await createUser();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.AWAITING_PAYMENT,
    });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await submitReview(token, job.id);

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('REVIEW_NOT_ALLOWED');
  });

  it('returns 400 with validation error for invalid rating', async () => {
    const category = await createCategory();
    const resident = await createUser();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await submitReview(token, job.id, { rating: 6 });

    expect(res.status).toBe(400);
  });

  it('creates review and updates provider avg_rating + review_count atomically', async () => {
    const db = getTestDb();
    const category = await createCategory();
    const resident = await createUser();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await submitReview(token, job.id, { rating: 4, comment: 'Great work!' });

    expect(res.status).toBe(201);
    expect(res.body.body.rating).toBe(4);
    expect(res.body.body.comment).toBe('Great work!');
    expect(res.body.body.job_id).toBe(job.id);

    const updatedProvider = await db('users').where('id', provider.userId).first();
    expect(Number(updatedProvider.review_count)).toBe(1);
    expect(Number(updatedProvider.avg_rating)).toBe(4);
  });

  it('returns 409 when a review already exists for the job', async () => {
    const category = await createCategory();
    const resident = await createUser();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });
    const token = await loginAs(resident.mobile, resident.password);

    await submitReview(token, job.id, { rating: 5 });
    const duplicate = await submitReview(token, job.id, { rating: 3 });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error_code).toBe('REVIEW_ALREADY_EXISTS');
  });

  it('calculates aggregate rating correctly across multiple reviews', async () => {
    const db = getTestDb();
    const category = await createCategory();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });

    const resident1 = await createUser();
    const resident2 = await createUser();
    const resident3 = await createUser();

    const job1 = await createJob({
      resident_id: resident1.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });
    const job2 = await createJob({
      resident_id: resident2.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });
    const job3 = await createJob({
      resident_id: resident3.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });

    const token1 = await loginAs(resident1.mobile, resident1.password);
    const token2 = await loginAs(resident2.mobile, resident2.password);
    const token3 = await loginAs(resident3.mobile, resident3.password);

    await submitReview(token1, job1.id, { rating: 4 });
    await submitReview(token2, job2.id, { rating: 2 });
    await submitReview(token3, job3.id, { rating: 3 });

    // avg = (4 + 2 + 3) / 3 = 3.00
    const updatedProvider = await db('users').where('id', provider.userId).first();
    expect(Number(updatedProvider.review_count)).toBe(3);
    expect(Number(updatedProvider.avg_rating)).toBeCloseTo(3.0, 1);
  });
});

// ─── GET /providers/:providerId/reviews ───────────────────────────────────────

describe('GET /api/v2/providers/:providerId/reviews', () => {
  it('returns 404 for a non-existent provider', async () => {
    const res = await request.get(
      '/api/v2/providers/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000/reviews'
    );
    expect(res.status).toBe(404);
  });

  it('returns empty paginated list when provider has no reviews', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });

    const res = await request.get(`/api/v2/providers/${provider.userId}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body.body.items).toHaveLength(0);
    expect(res.body.body.pagination.total).toBe(0);
  });

  it('returns paginated reviews with resident name', async () => {
    const category = await createCategory();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const resident = await createUser();
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PAID,
    });
    const token = await loginAs(resident.mobile, resident.password);
    await submitReview(token, job.id, { rating: 5, comment: 'Excellent!' });

    const res = await request.get(`/api/v2/providers/${provider.userId}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body.body.items).toHaveLength(1);
    expect(res.body.body.items[0].rating).toBe(5);
    expect(res.body.body.items[0].comment).toBe('Excellent!');
    expect(res.body.body.items[0].resident_name).toBeDefined();
    expect(res.body.body.pagination.total).toBe(1);
  });

  it('respects page and limit query params', async () => {
    const db = getTestDb();
    const category = await createCategory();
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });

    // Create 3 reviews directly in DB
    for (let i = 0; i < 3; i++) {
      const resident = await createUser();
      const job = await createJob({
        resident_id: resident.userId,
        category_id: category.id,
        provider_id: provider.userId,
        status: JobStatus.PAID,
      });
      await db('reviews').insert({
        job_id: job.id,
        resident_id: resident.userId,
        provider_id: provider.userId,
        rating: i + 3,
      });
    }

    const res = await request.get(
      `/api/v2/providers/${provider.userId}/reviews?page=1&limit=2`
    );

    expect(res.status).toBe(200);
    expect(res.body.body.items).toHaveLength(2);
    expect(res.body.body.pagination.total).toBe(3);
    expect(res.body.body.pagination.totalPages).toBe(2);
  });
});
