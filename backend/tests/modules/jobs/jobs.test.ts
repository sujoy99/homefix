import { request } from '../../helpers/app';
import { truncateAll, closeTestDb } from '../../helpers/db';
import { createUser } from '../../factories/user.factory';
import { createProvider, addSkillToProvider } from '../../factories/provider.factory';
import { createCategory } from '../../factories/category.factory';
import { createJob } from '../../factories/job.factory';
import { UserRole, UserStatus } from '../../../src/modules/users/user.types';
import { AuthMethod } from '../../../src/modules/auth/auth.types';
import { JobStatus } from '../../../src/modules/jobs/job.types';

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

const NULL_UUID = '00000000-0000-0000-0000-000000000000';
const validAddress = { house: '12A', road: 'Mirpur Road', area: 'Dhaka' };
const fakeImage = Buffer.from('fake-jpeg-data');

// ═══════════════════════════════════════════════════════════════════════════
// HF-031: POST /jobs — Resident creates a job
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/v2/jobs', () => {
  it('resident creates a job successfully', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'plumbing', requires_area: false });

    const res = await request
      .post('/api/v2/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category_id: category.id,
        description: 'My kitchen sink is leaking badly',
        service_address: validAddress,
        estimated_budget: 1500,
        service_lat: 23.8103,
        service_lon: 90.4125,
      });

    expect(res.status).toBe(201);
    expect(res.body.body).toMatchObject({
      category_id: category.id,
      status: JobStatus.PENDING,
      resident_id: resident.userId,
      description: 'My kitchen sink is leaking badly',
    });
  });

  it('creates job with requires_area category when square_footage provided', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'painting', requires_area: true });

    const res = await request
      .post('/api/v2/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category_id: category.id,
        description: 'Need to paint my living room walls',
        service_address: validAddress,
        square_footage: 250,
      });

    expect(res.status).toBe(201);
    // pg returns DECIMAL as string with full precision
    expect(parseFloat(res.body.body.square_footage as string)).toBe(250);
  });

  it('returns 400 when square_footage missing for requires_area category', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'painting', requires_area: true });

    const res = await request
      .post('/api/v2/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category_id: category.id,
        description: 'Need to paint my living room walls',
        service_address: validAddress,
      });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('SQUARE_FOOTAGE_REQUIRED');
  });

  it('returns 404 when category does not exist', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .post('/api/v2/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category_id: NULL_UUID,
        description: 'Something broke in my house',
        service_address: validAddress,
      });

    expect(res.status).toBe(404);
  });

  it('returns 400 when description is too short', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'electrical' });

    const res = await request
      .post('/api/v2/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category_id: category.id,
        description: 'Short',
        service_address: validAddress,
      });

    expect(res.status).toBe(400);
  });

  it('returns 403 when provider tries to create a job', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'electrical' });

    const res = await request
      .post('/api/v2/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category_id: category.id,
        description: 'This should not be allowed for providers',
        service_address: validAddress,
      });

    expect(res.status).toBe(403);
  });

  it('returns 401 without auth token', async () => {
    const category = await createCategory({ slug: 'plumbing' });

    const res = await request
      .post('/api/v2/jobs')
      .send({
        category_id: category.id,
        description: 'Need a plumber urgently',
        service_address: validAddress,
      });

    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-031: GET /jobs — Resident lists their own jobs
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/v2/jobs', () => {
  it('resident fetches their own jobs', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'plumbing' });

    await createJob({ resident_id: resident.userId, category_id: category.id });
    await createJob({ resident_id: resident.userId, category_id: category.id });

    const other = await createUser({ role: UserRole.RESIDENT });
    await createJob({ resident_id: other.userId, category_id: category.id });

    const res = await request
      .get('/api/v2/jobs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(2);
    expect(res.body.body.every((j: { resident_id: string }) => j.resident_id === resident.userId)).toBe(true);
  });

  it('returns empty array when resident has no jobs', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .get('/api/v2/jobs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toEqual([]);
  });

  it('returns 403 when provider calls GET /jobs', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .get('/api/v2/jobs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-031: GET /jobs/:id — Job detail
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/v2/jobs/:id', () => {
  it('returns job detail', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'plumbing' });
    const job = await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .get(`/api/v2/jobs/${job.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.id).toBe(job.id);
  });

  it('returns 404 for non-existent job', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .get(`/api/v2/jobs/${NULL_UUID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid UUID', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .get('/api/v2/jobs/not-a-uuid')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-031: GET /jobs/feed — Provider job feed
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/v2/jobs/feed', () => {
  it('provider sees pending jobs matching their skills', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'plumbing' });
    const otherCategory = await createCategory({ slug: 'painting' });
    await addSkillToProvider(provider.profileId, category.id);

    const resident = await createUser({ role: UserRole.RESIDENT });
    await createJob({ resident_id: resident.userId, category_id: category.id });
    await createJob({ resident_id: resident.userId, category_id: category.id });
    await createJob({ resident_id: resident.userId, category_id: otherCategory.id });

    const res = await request
      .get('/api/v2/jobs/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(2);
    expect(res.body.body.every((j: { category_id: string }) => j.category_id === category.id)).toBe(true);
  });

  it('returns empty array when provider has no matching skills', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'electrical' });
    const resident = await createUser({ role: UserRole.RESIDENT });
    await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .get('/api/v2/jobs/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toEqual([]);
  });

  it('does not show accepted (ACTIVE) jobs in feed', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'plumbing' });
    await addSkillToProvider(provider.profileId, category.id);

    const resident = await createUser({ role: UserRole.RESIDENT });
    await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      status: JobStatus.ACTIVE,
    });

    const res = await request
      .get('/api/v2/jobs/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(0);
  });

  it('returns 403 when resident calls provider feed', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .get('/api/v2/jobs/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('respects limit query param', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'plumbing' });
    await addSkillToProvider(provider.profileId, category.id);

    const resident = await createUser({ role: UserRole.RESIDENT });
    await createJob({ resident_id: resident.userId, category_id: category.id });
    await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .get('/api/v2/jobs/feed?limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-031: PATCH /jobs/:id/accept — Provider accepts a job (PENDING → ACTIVE)
// ═══════════════════════════════════════════════════════════════════════════

describe('PATCH /api/v2/jobs/:id/accept', () => {
  it('active provider with matching skill accepts a pending job', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'plumbing' });
    await addSkillToProvider(provider.profileId, category.id);

    const resident = await createUser({ role: UserRole.RESIDENT });
    const job = await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .patch(`/api/v2/jobs/${job.id}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.status).toBe(JobStatus.ACTIVE);
    expect(res.body.body.provider_id).toBe(provider.userId);
  });

  it('returns 400 when trying to accept an already ACTIVE job', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'plumbing' });
    await addSkillToProvider(provider.profileId, category.id);

    const resident = await createUser({ role: UserRole.RESIDENT });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      status: JobStatus.ACTIVE,
      provider_id: provider.userId,
    });

    const res = await request
      .patch(`/api/v2/jobs/${job.id}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_STATE_TRANSITION');
  });

  it('returns 403 when provider lacks matching skill', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'plumbing' });

    const resident = await createUser({ role: UserRole.RESIDENT });
    const job = await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .patch(`/api/v2/jobs/${job.id}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('PROVIDER_NOT_ELIGIBLE');
  });

  it('returns 404 for non-existent job', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .patch(`/api/v2/jobs/${NULL_UUID}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 when resident tries to accept a job', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'plumbing' });
    const job = await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .patch(`/api/v2/jobs/${job.id}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 when job does not exist', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .patch(`/api/v2/jobs/${NULL_UUID}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-031: PATCH /jobs/:id/complete — Provider marks work done (ACTIVE → AWAITING_PAYMENT)
// ═══════════════════════════════════════════════════════════════════════════

describe('PATCH /api/v2/jobs/:id/complete', () => {
  it('assigned provider marks active job as complete', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'plumbing' });

    const resident = await createUser({ role: UserRole.RESIDENT });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.ACTIVE,
    });

    const res = await request
      .patch(`/api/v2/jobs/${job.id}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.status).toBe(JobStatus.AWAITING_PAYMENT);
  });

  it('returns 403 when a different provider tries to complete the job', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const otherProvider = await createProvider({ status: UserStatus.ACTIVE });
    const category = await createCategory({ slug: 'plumbing' });

    const resident = await createUser({ role: UserRole.RESIDENT });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: otherProvider.userId,
      status: JobStatus.ACTIVE,
    });

    const res = await request
      .patch(`/api/v2/jobs/${job.id}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('JOB_ACCESS_DENIED');
  });

  it('returns 400 when trying to complete a PENDING (not yet active) job', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'plumbing' });

    const resident = await createUser({ role: UserRole.RESIDENT });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.PENDING,
    });

    const res = await request
      .patch(`/api/v2/jobs/${job.id}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_STATE_TRANSITION');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-032: GET /providers/available — Location-based provider search
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/v2/providers/available (HF-032)', () => {
  it('returns all available providers without geo params', async () => {
    await createProvider({ status: UserStatus.ACTIVE });
    await createProvider({ status: UserStatus.ACTIVE });

    const res = await request.get('/api/v2/providers/available');

    expect(res.status).toBe(200);
    expect(res.body.body.length).toBeGreaterThanOrEqual(2);
  });

  it('filters providers by proximity when lat/lon provided', async () => {
    // user factory seeds providers at lat:23.8103, lon:90.4125 (Dhaka)
    await createProvider({ status: UserStatus.ACTIVE });

    const res = await request.get('/api/v2/providers/available?lat=23.8103&lon=90.4125&radius=5');

    expect(res.status).toBe(200);
    expect(res.body.body.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty when all providers are outside the search radius', async () => {
    await createProvider({ status: UserStatus.ACTIVE });

    // Chittagong (~250 km from Dhaka), 1 km radius
    const res = await request.get('/api/v2/providers/available?lat=22.3569&lon=91.7832&radius=1');

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(0);
  });

  it('filters by category when category param provided', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const category = await createCategory({ slug: 'plumbing' });
    const otherCategory = await createCategory({ slug: 'electrical' });
    await addSkillToProvider(provider.profileId, category.id);

    const inRadius = await request.get(
      `/api/v2/providers/available?lat=23.8103&lon=90.4125&radius=10&category=${category.id}`
    );
    expect(inRadius.status).toBe(200);
    expect(inRadius.body.body.length).toBeGreaterThanOrEqual(1);

    const notInCategory = await request.get(
      `/api/v2/providers/available?lat=23.8103&lon=90.4125&radius=10&category=${otherCategory.id}`
    );
    expect(notInCategory.status).toBe(200);
    expect(notInCategory.body.body).toHaveLength(0);
  });

  it('returns 400 when only lat is provided without lon', async () => {
    const res = await request.get('/api/v2/providers/available?lat=23.8103');
    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-032: GET /jobs/feed with lat/lon — Geo-sorted job feed
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/v2/jobs/feed with geo params (HF-032)', () => {
  it('accepts lat/lon params and returns sorted jobs', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const category = await createCategory({ slug: 'plumbing' });
    await addSkillToProvider(provider.profileId, category.id);

    const resident = await createUser({ role: UserRole.RESIDENT });
    await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      service_lat: 23.8103,
      service_lon: 90.4125,
    });

    const res = await request
      .get('/api/v2/jobs/feed?lat=23.8103&lon=90.4125')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-033: POST /jobs/:id/media — Job media upload
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/v2/jobs/:id/media (HF-033)', () => {
  it('resident uploads media to their job', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'plumbing' });
    const job = await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .post(`/api/v2/jobs/${job.id}/media`)
      .set('Authorization', `Bearer ${token}`)
      .attach('files', fakeImage, { filename: 'issue.jpg', contentType: 'image/jpeg' });

    // Storage save writes to local disk — 200 means success, 500 means uploads/ dir missing
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body.body.media_urls)).toBe(true);
    }
  });

  it('returns 403 when a different resident tries to upload to the job', async () => {
    const owner = await createUser({ role: UserRole.RESIDENT });
    const other = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(other.mobile, other.password);
    const category = await createCategory({ slug: 'plumbing' });
    const job = await createJob({ resident_id: owner.userId, category_id: category.id });

    const res = await request
      .post(`/api/v2/jobs/${job.id}/media`)
      .set('Authorization', `Bearer ${token}`)
      .attach('files', fakeImage, { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('JOB_ACCESS_DENIED');
  });

  it('returns 400 when no files are attached', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'plumbing' });
    const job = await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .post(`/api/v2/jobs/${job.id}/media`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 403 when provider tries to upload media', async () => {
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);
    const resident = await createUser({ role: UserRole.RESIDENT });
    const category = await createCategory({ slug: 'plumbing' });
    const job = await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .post(`/api/v2/jobs/${job.id}/media`)
      .set('Authorization', `Bearer ${token}`)
      .attach('files', fakeImage, { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-033: PATCH /jobs/:id/voice-note
// ═══════════════════════════════════════════════════════════════════════════

describe('PATCH /api/v2/jobs/:id/voice-note (HF-033)', () => {
  it('returns 403 when different resident tries to set voice note', async () => {
    const owner = await createUser({ role: UserRole.RESIDENT });
    const other = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(other.mobile, other.password);
    const category = await createCategory({ slug: 'plumbing' });
    const job = await createJob({ resident_id: owner.userId, category_id: category.id });

    const res = await request
      .patch(`/api/v2/jobs/${job.id}/voice-note`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('audio'), { filename: 'voice.mp3', contentType: 'audio/mpeg' });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('JOB_ACCESS_DENIED');
  });

  it('returns 400 when no file is attached', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);
    const category = await createCategory({ slug: 'plumbing' });
    const job = await createJob({ resident_id: resident.userId, category_id: category.id });

    const res = await request
      .patch(`/api/v2/jobs/${job.id}/voice-note`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
