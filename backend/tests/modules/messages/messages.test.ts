import { request } from '../../helpers/app';
import { truncateAll, closeTestDb } from '../../helpers/db';
import { createUser } from '../../factories/user.factory';
import { createProvider } from '../../factories/provider.factory';
import { createCategory } from '../../factories/category.factory';
import { createJob } from '../../factories/job.factory';
import { createMessage } from '../../factories/message.factory';
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
// HF-100: POST /api/v2/jobs/:id/messages — Send a message
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/v2/jobs/:id/messages (HF-100)', () => {
  it('201 — resident sends a message to active job', async () => {
    const { job, residentToken, resident } = await setupActiveJob();

    const res = await request
      .post(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ content: 'Please come at 10am' });

    expect(res.status).toBe(201);
    expect(res.body.body).toMatchObject({
      job_id: job.id,
      sender_id: resident.userId,
      content: 'Please come at 10am',
      type: 'text',
    });
    expect(res.body.body.id).toBeDefined();
    expect(res.body.body.created_at).toBeDefined();
  });

  it('201 — provider sends a message to active job', async () => {
    const { job, providerToken, provider } = await setupActiveJob();

    const res = await request
      .post(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ content: 'I will be there soon' });

    expect(res.status).toBe(201);
    expect(res.body.body).toMatchObject({
      job_id: job.id,
      sender_id: provider.userId,
      content: 'I will be there soon',
      type: 'text',
    });
  });

  it('400 — job is PENDING (not ACTIVE) → MESSAGING_NOT_AVAILABLE', async () => {
    const category = await createCategory();
    const resident = await createUser({ role: UserRole.RESIDENT });
    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      status: JobStatus.PENDING,
    });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .post(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello?' });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('MESSAGING_NOT_AVAILABLE');
  });

  it('403 — different resident (non-participant) → JOB_ACCESS_DENIED', async () => {
    const { job } = await setupActiveJob();
    const otherResident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(otherResident.mobile, otherResident.password);

    const res = await request
      .post(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Can I join?' });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('JOB_ACCESS_DENIED');
  });

  it('403 — provider not assigned to job → JOB_ACCESS_DENIED', async () => {
    const { job } = await setupActiveJob();
    const otherProvider = await createProvider({ status: UserStatus.ACTIVE });
    const token = await loginAs(otherProvider.mobile, otherProvider.password);

    const res = await request
      .post(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello?' });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('JOB_ACCESS_DENIED');
  });

  it('401 — no token', async () => {
    const { job } = await setupActiveJob();

    const res = await request
      .post(`/api/v2/jobs/${job.id}/messages`)
      .send({ content: 'Hello?' });

    expect(res.status).toBe(401);
  });

  it('400 — empty content fails Zod validation', async () => {
    const { job, residentToken } = await setupActiveJob();

    const res = await request
      .post(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });

  it('404 — non-existent job UUID', async () => {
    const resident = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .post(`/api/v2/jobs/${NULL_UUID}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello?' });

    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HF-100: GET /api/v2/jobs/:id/messages — List messages
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/v2/jobs/:id/messages (HF-100)', () => {
  it('200 — returns empty list + null next_cursor when no messages', async () => {
    const { job, residentToken } = await setupActiveJob();

    const res = await request
      .get(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toMatchObject({
      items: [],
      next_cursor: null,
    });
  });

  it('200 — returns messages in DESC order (newest first)', async () => {
    const { job, resident, provider, residentToken } = await setupActiveJob();

    await createMessage({ job_id: job.id, sender_id: resident.userId, content: 'First' });
    await createMessage({ job_id: job.id, sender_id: provider.userId, content: 'Second' });
    await createMessage({ job_id: job.id, sender_id: resident.userId, content: 'Third' });

    const res = await request
      .get(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    const items = res.body.body.items as Array<{ content: string }>;
    expect(items).toHaveLength(3);
    expect(items[0]!.content).toBe('Third');
    expect(items[2]!.content).toBe('First');
  });

  it('200 — cursor pagination: before param returns older messages only', async () => {
    const { job, resident, residentToken } = await setupActiveJob();

    const msg1 = await createMessage({ job_id: job.id, sender_id: resident.userId, content: 'Oldest' });
    const msg2 = await createMessage({ job_id: job.id, sender_id: resident.userId, content: 'Middle' });
    await createMessage({ job_id: job.id, sender_id: resident.userId, content: 'Newest' });

    // First page
    const firstPage = await request
      .get(`/api/v2/jobs/${job.id}/messages?limit=2`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(firstPage.status).toBe(200);
    const cursor = firstPage.body.body.next_cursor as string;
    expect(cursor).toBe(msg2.id);

    // Second page (before the cursor = msg2.id)
    const secondPage = await request
      .get(`/api/v2/jobs/${job.id}/messages?limit=2&before=${cursor}`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(secondPage.status).toBe(200);
    const items = secondPage.body.body.items as Array<{ content: string }>;
    expect(items).toHaveLength(1);
    expect(items[0]!.content).toBe('Oldest');
    expect(items[0]!.content).not.toBe(msg1.content === 'Oldest' ? 'Middle' : '');
  });

  it('200 — next_cursor is null when fewer messages than limit', async () => {
    const { job, resident, residentToken } = await setupActiveJob();

    await createMessage({ job_id: job.id, sender_id: resident.userId, content: 'Only one' });

    const res = await request
      .get(`/api/v2/jobs/${job.id}/messages?limit=10`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.body.next_cursor).toBeNull();
    expect(res.body.body.items).toHaveLength(1);
  });

  it('200 — next_cursor is set when messages equal limit', async () => {
    const { job, resident, residentToken } = await setupActiveJob();

    await createMessage({ job_id: job.id, sender_id: resident.userId, content: 'Msg 1' });
    await createMessage({ job_id: job.id, sender_id: resident.userId, content: 'Msg 2' });

    const res = await request
      .get(`/api/v2/jobs/${job.id}/messages?limit=2`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.body.next_cursor).not.toBeNull();
    expect(res.body.body.items).toHaveLength(2);
  });

  it('403 — non-participant → JOB_ACCESS_DENIED', async () => {
    const { job } = await setupActiveJob();
    const outsider = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(outsider.mobile, outsider.password);

    const res = await request
      .get(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe('JOB_ACCESS_DENIED');
  });

  it('401 — no token', async () => {
    const { job } = await setupActiveJob();

    const res = await request.get(`/api/v2/jobs/${job.id}/messages`);

    expect(res.status).toBe(401);
  });

  it('400 — job is not ACTIVE', async () => {
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
      .get(`/api/v2/jobs/${job.id}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('MESSAGING_NOT_AVAILABLE');
  });
});
