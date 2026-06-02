import { JobStatus } from '@homefix/shared';
import { request } from '../../helpers/app';
import { truncateAll, closeTestDb, getTestDb } from '../../helpers/db';
import { createUser } from '../../factories/user.factory';
import { createCategory } from '../../factories/category.factory';
import { createJob } from '../../factories/job.factory';
import { AuthMethod } from '../../../src/modules/auth/auth.types';
import { UserRole, UserStatus } from '../../../src/modules/users/user.types';
import { NotificationType } from '../../../src/modules/notifications/notification.types';

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

// ─── Device token registration ──────────────────────────────────────────────

describe('POST /users/me/device-token', () => {
  it('returns 401 without auth token', async () => {
    const res = await request
      .post('/api/v2/users/me/device-token')
      .send({ token: 'fcm-token-abc', platform: 'android' });
    expect(res.status).toBe(401);
  });

  it('registers a device token and returns 201', async () => {
    const user = await createUser();
    const token = await loginAs(user.mobile, user.password);

    const res = await request
      .post('/api/v2/users/me/device-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'fcm-token-xyz', platform: 'android' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Device token registered');
  });

  it('is idempotent — duplicate registration does not error', async () => {
    const user = await createUser();
    const token = await loginAs(user.mobile, user.password);

    await request
      .post('/api/v2/users/me/device-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'fcm-dup', platform: 'ios' });

    const res = await request
      .post('/api/v2/users/me/device-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'fcm-dup', platform: 'ios' });

    expect(res.status).toBe(201);
  });

  it('returns 400 for invalid platform', async () => {
    const user = await createUser();
    const token = await loginAs(user.mobile, user.password);

    const res = await request
      .post('/api/v2/users/me/device-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'fcm-token', platform: 'blackberry' });

    expect(res.status).toBe(400);
  });
});

// ─── Device token removal ────────────────────────────────────────────────────

describe('DELETE /users/me/device-token', () => {
  it('removes a registered token', async () => {
    const user = await createUser();
    const authToken = await loginAs(user.mobile, user.password);
    const db = getTestDb();

    await request
      .post('/api/v2/users/me/device-token')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: 'to-remove', platform: 'web' });

    let rows = await db('device_tokens').where({ user_id: user.userId, token: 'to-remove' });
    expect(rows).toHaveLength(1);

    await request
      .delete('/api/v2/users/me/device-token')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: 'to-remove', platform: 'web' });

    rows = await db('device_tokens').where({ user_id: user.userId, token: 'to-remove' });
    expect(rows).toHaveLength(0);
  });
});

// ─── Notification listing ────────────────────────────────────────────────────

describe('GET /users/me/notifications', () => {
  it('returns 401 without auth token', async () => {
    const res = await request.get('/api/v2/users/me/notifications');
    expect(res.status).toBe(401);
  });

  it('returns empty list when no notifications', async () => {
    const user = await createUser();
    const token = await loginAs(user.mobile, user.password);

    const res = await request
      .get('/api/v2/users/me/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.items).toHaveLength(0);
    expect(res.body.body.unread_count).toBe(0);
    expect(res.body.body.pagination.total).toBe(0);
  });

  it('returns persisted notifications with pagination meta', async () => {
    const db = getTestDb();
    const user = await createUser();
    const token = await loginAs(user.mobile, user.password);

    // Insert 3 notifications directly
    await db('notifications').insert([
      { user_id: user.userId, type: NotificationType.JOB_ACCEPTED, title_en: 'T1', title_bn: 'T1', body_en: 'B1', body_bn: 'B1', is_read: false },
      { user_id: user.userId, type: NotificationType.JOB_COMPLETED, title_en: 'T2', title_bn: 'T2', body_en: 'B2', body_bn: 'B2', is_read: false },
      { user_id: user.userId, type: NotificationType.PAYMENT_RECEIVED, title_en: 'T3', title_bn: 'T3', body_en: 'B3', body_bn: 'B3', is_read: true },
    ]);

    const res = await request
      .get('/api/v2/users/me/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.items).toHaveLength(3);
    expect(res.body.body.unread_count).toBe(2);
    expect(res.body.body.pagination.total).toBe(3);
  });

  it('respects page and limit query params', async () => {
    const db = getTestDb();
    const user = await createUser();
    const token = await loginAs(user.mobile, user.password);

    await db('notifications').insert(
      Array.from({ length: 5 }, (_, i) => ({
        user_id: user.userId,
        type: NotificationType.JOB_ACCEPTED,
        title_en: `T${i}`, title_bn: `T${i}`,
        body_en: `B${i}`, body_bn: `B${i}`,
        is_read: false,
      })),
    );

    const res = await request
      .get('/api/v2/users/me/notifications?page=2&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.items).toHaveLength(2);
    expect(res.body.body.pagination.page).toBe(2);
    expect(res.body.body.pagination.totalPages).toBe(3);
  });
});

// ─── Mark as read ────────────────────────────────────────────────────────────

describe('PATCH /users/me/notifications/:id/read', () => {
  it('marks a notification as read', async () => {
    const db = getTestDb();
    const user = await createUser();
    const token = await loginAs(user.mobile, user.password);

    const [row] = await db('notifications')
      .insert({ user_id: user.userId, type: NotificationType.JOB_ACCEPTED, title_en: 'T', title_bn: 'T', body_en: 'B', body_bn: 'B', is_read: false })
      .returning('id');

    const res = await request
      .patch(`/api/v2/users/me/notifications/${row.id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.is_read).toBe(true);
  });

  it('returns 404 for non-existent or other user notification', async () => {
    const user = await createUser();
    const token = await loginAs(user.mobile, user.password);
    const fakeId = 'a0000000-0000-4000-8000-000000000001'; // valid UUID v4 that doesn't exist

    const res = await request
      .patch(`/api/v2/users/me/notifications/${fakeId}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ─── Job event triggers ──────────────────────────────────────────────────────

describe('Notification triggers — job events', () => {
  it('creates JOB_ACCEPTED notification for resident when provider accepts job', async () => {
    const db = getTestDb();
    const category = await createCategory();
    const resident = await createUser({ role: UserRole.RESIDENT });
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });

    // Build provider profile to meet the 70% completion threshold
    // (name_mobile:10 + home_location:10 + skills:15 + bio:10 + hourly_rate:10 + mfs_account:20 = 75)
    const [profile] = await db('provider_profiles')
      .insert({
        user_id: provider.userId,
        bio: 'Experienced plumber with 5 years in the field.',
        experience_years: 5,
        hourly_rate: 500,
      })
      .returning('id');
    await db('provider_skills').insert({ provider_id: profile.id, category_id: category.id });
    await db('provider_payment_accounts').insert({
      user_id: provider.userId,
      mfs_type: 'bkash',
      account_number: '01700000001',
      account_name: 'Test Provider',
    });

    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      status: JobStatus.PENDING,
    });

    const providerToken = await loginAs(provider.mobile, provider.password);
    const res = await request
      .patch(`/api/v2/jobs/${job.id}/accept`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);

    // Brief wait for fire-and-forget notification
    await new Promise((r) => setTimeout(r, 100));

    const notifications = await db('notifications').where({
      user_id: resident.userId,
      type: NotificationType.JOB_ACCEPTED,
    });
    expect(notifications).toHaveLength(1);
  });

  it('creates JOB_COMPLETED notification for resident when provider completes job', async () => {
    const db = getTestDb();
    const category = await createCategory();
    const resident = await createUser({ role: UserRole.RESIDENT });
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });

    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.ACTIVE,
    });

    const providerToken = await loginAs(provider.mobile, provider.password);
    const res = await request
      .patch(`/api/v2/jobs/${job.id}/complete`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 100));

    const notifications = await db('notifications').where({
      user_id: resident.userId,
      type: NotificationType.JOB_COMPLETED,
    });
    expect(notifications).toHaveLength(1);
  });
});
