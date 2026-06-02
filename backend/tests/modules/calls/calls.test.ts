import { request } from '../../helpers/app';
import { truncateAll, closeTestDb } from '../../helpers/db';
import { createUser } from '../../factories/user.factory';
import { createProvider } from '../../factories/provider.factory';
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

const NULL_UUID = '00000000-0000-0000-0000-000000000000';

async function loginAs(mobile: string, password: string): Promise<string> {
  const res = await request.post('/api/v2/auth/login').send({
    method: AuthMethod.PASSWORD,
    mobile,
    password,
    deviceId: 'test-device',
  });
  return res.body.body.tokens.accessToken as string;
}

async function setupActiveJob() {
  const category = await createCategory();
  const resident = await createUser({ role: UserRole.RESIDENT });
  const provider = await createProvider({ status: UserStatus.ACTIVE });
  const job = await createJob({
    resident_id: resident.userId,
    category_id: category.id,
    provider_id: provider.userId,
    status: JobStatus.ACTIVE,
  });
  const residentToken = await loginAs(resident.mobile, resident.password);
  const providerToken = await loginAs(provider.mobile, provider.password);
  return { resident, provider, job, residentToken, providerToken };
}

// ═══════════════════════════════════════════════════════════════════════════
// HF-101: POST /api/v2/jobs/:id/call/room — Create a call room
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/v2/jobs/:id/call/room (HF-101)', () => {
  it('201 — resident gets a room config for an active job', async () => {
    const { job, residentToken } = await setupActiveJob();

    const res = await request
      .post(`/api/v2/jobs/${job.id}/call/room`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(201);
    expect(res.body.body).toMatchObject({
      provider: 'jitsi',
      roomName: `homefix-job-${job.id}`,
      serverUrl: expect.any(String),
    });
  });

  it('201 — provider gets a room config for an active job', async () => {
    const { job, providerToken } = await setupActiveJob();

    const res = await request
      .post(`/api/v2/jobs/${job.id}/call/room`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(201);
    expect(res.body.body.roomName).toBe(`homefix-job-${job.id}`);
  });

  it('201 — room name is deterministic (idempotent across calls)', async () => {
    const { job, residentToken } = await setupActiveJob();

    const res1 = await request
      .post(`/api/v2/jobs/${job.id}/call/room`)
      .set('Authorization', `Bearer ${residentToken}`);
    const res2 = await request
      .post(`/api/v2/jobs/${job.id}/call/room`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res1.body.body.roomName).toBe(res2.body.body.roomName);
    expect(res1.body.body.serverUrl).toBe(res2.body.body.serverUrl);
  });

  it('400 — job is PENDING (not ACTIVE) → CALL_NOT_AVAILABLE', async () => {
    const category = await createCategory();
    const resident = await createUser({ role: UserRole.RESIDENT });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      status: JobStatus.PENDING,
    });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .post(`/api/v2/jobs/${job.id}/call/room`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('CALL_NOT_AVAILABLE');
  });

  it('400 — job is AWAITING_PAYMENT → CALL_NOT_AVAILABLE', async () => {
    const category = await createCategory();
    const resident = await createUser({ role: UserRole.RESIDENT });
    const provider = await createProvider({ status: UserStatus.ACTIVE });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.AWAITING_PAYMENT,
    });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .post(`/api/v2/jobs/${job.id}/call/room`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('CALL_NOT_AVAILABLE');
  });

  it('403 — non-participant resident → JOB_ACCESS_DENIED', async () => {
    const { job } = await setupActiveJob();
    const outsider = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(outsider.mobile, outsider.password);

    const res = await request
      .post(`/api/v2/jobs/${job.id}/call/room`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('JOB_ACCESS_DENIED');
  });

  it('403 — provider not assigned to job → JOB_ACCESS_DENIED', async () => {
    const { job } = await setupActiveJob();
    const otherProvider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(otherProvider.mobile, otherProvider.password);

    const res = await request
      .post(`/api/v2/jobs/${job.id}/call/room`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('JOB_ACCESS_DENIED');
  });

  it('401 — no token', async () => {
    const { job } = await setupActiveJob();

    const res = await request.post(`/api/v2/jobs/${job.id}/call/room`);

    expect(res.status).toBe(401);
  });

  it('404 — non-existent job UUID', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .post(`/api/v2/jobs/${NULL_UUID}/call/room`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
