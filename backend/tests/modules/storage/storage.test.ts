import path from 'path';
import fs from 'fs';
import { request } from '../../helpers/app';
import { truncateAll, closeTestDb } from '../../helpers/db';
import { createUser } from '../../factories/user.factory';
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

// Small in-memory PNG fixture (1×1 transparent pixel)
const PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// ─── POST /storage/upload ─────────────────────────────────────────────────

describe('POST /api/v2/storage/upload', () => {
  it('authenticated resident uploads an image successfully', async () => {
    const user = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(user.mobile, user.password);

    const res = await request
      .post('/api/v2/storage/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG_BUFFER, { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.body).toHaveProperty('key');
    expect(res.body.body).toHaveProperty('url');
    expect(res.body.body.url).toMatch(/^\/uploads\//);

    // Clean up uploaded file
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, res.body.body.key as string);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  it('authenticated provider uploads a file successfully', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .post('/api/v2/storage/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG_BUFFER, { filename: 'nid.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.body.key).toBeTruthy();

    const uploadDir = path.resolve(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, res.body.body.key as string);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  it('returns 400 when no file is attached', async () => {
    const user = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(user.mobile, user.password);

    const res = await request
      .post('/api/v2/storage/upload')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 400 for disallowed MIME type', async () => {
    const user = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(user.mobile, user.password);

    const res = await request
      .post('/api/v2/storage/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('<html></html>'), {
        filename: 'evil.html',
        contentType: 'text/html',
      });

    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request
      .post('/api/v2/storage/upload')
      .attach('file', PNG_BUFFER, { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
  });
});

// ─── DELETE /storage/:key ─────────────────────────────────────────────────

describe('DELETE /api/v2/storage/:key', () => {
  it('deletes an uploaded file', async () => {
    const user = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(user.mobile, user.password);

    // Upload first
    const upload = await request
      .post('/api/v2/storage/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG_BUFFER, { filename: 'del.png', contentType: 'image/png' });

    const { key } = upload.body.body as { key: string };

    const del = await request
      .delete(`/api/v2/storage/${key}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(200);
  });

  it('returns 200 even if file does not exist (idempotent)', async () => {
    const user = await createUser({ role: UserRole.RESIDENT });
    const token = await loginAs(user.mobile, user.password);

    const res = await request
      .delete('/api/v2/storage/nonexistent-key.jpg')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 without token', async () => {
    const res = await request.delete('/api/v2/storage/some-key.jpg');
    expect(res.status).toBe(401);
  });
});
