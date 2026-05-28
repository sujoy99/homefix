import { request } from '../../helpers/app';
import { truncateAll, closeTestDb } from '../../helpers/db';
import { createUser } from '../../factories/user.factory';
import { UserRole } from '../../../src/modules/users/user.types';
import { AuthMethod } from '../../../src/modules/auth/auth.types';

afterEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await closeTestDb();
});

describe('POST /api/v2/auth/register', () => {
  it('registers a resident and returns 201', async () => {
    const res = await request.post('/api/v2/auth/register').send({
      full_name: 'Rahim Uddin',
      mobile: '01712345678',
      nid: '1234567890',
      email: 'rahim@test.com',
      password: 'Password@123',
      role: UserRole.RESIDENT,
      latitude: 23.8103,
      longitude: 90.4125,
    });

    expect(res.status).toBe(201);
    expect(res.body.body).toMatchObject({
      role: UserRole.RESIDENT,
      mobile: '01712345678',
    });
  });

  it('rejects duplicate mobile with 409', async () => {
    await createUser({ mobile: '01799999999' });

    const res = await request.post('/api/v2/auth/register').send({
      full_name: 'Duplicate',
      mobile: '01799999999',
      nid: '9999999999',
      password: 'Password@123',
      role: UserRole.RESIDENT,
      latitude: 23.8103,
      longitude: 90.4125,
    });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v2/auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    const user = await createUser({ mobile: '01711111111' });

    const res = await request.post('/api/v2/auth/login').send({
      method: AuthMethod.PASSWORD,
      mobile: user.mobile,
      password: user.password,
      deviceId: 'test-device-001',
    });

    expect(res.status).toBe(200);
    expect(res.body.body.tokens).toHaveProperty('accessToken');
    expect(res.body.body.tokens).toHaveProperty('refreshToken');
  });

  it('rejects wrong password with 401', async () => {
    const user = await createUser({ mobile: '01722222222' });

    const res = await request.post('/api/v2/auth/login').send({
      method: AuthMethod.PASSWORD,
      mobile: user.mobile,
      password: 'WrongPass@999',
      deviceId: 'test-device-002',
    });

    expect(res.status).toBe(401);
  });
});
