import { MfsType, WithdrawalStatus } from '@homefix/shared';
import { request } from '../../helpers/app';
import { truncateAll, closeTestDb, getTestDb } from '../../helpers/db';
import { createAdmin, createUser } from '../../factories/user.factory';
import { createCategory } from '../../factories/category.factory';
import { createJob } from '../../factories/job.factory';
import { AuthMethod } from '../../../src/modules/auth/auth.types';
import { UserRole, UserStatus } from '../../../src/modules/users/user.types';
import { JobStatus } from '../../../src/modules/jobs/job.types';
import { WalletRepository } from '../../../src/modules/payments/wallet/wallet.repository';

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

async function seedWallet(userId: string, balancePaisa: number): Promise<string> {
  const db = getTestDb();
  const jobId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000';
  const trx = await db.transaction();
  try {
    await WalletRepository.creditWallet(userId, balancePaisa, jobId, trx);
    await trx.commit();
  } catch (e) {
    await trx.rollback();
    throw e;
  }
  const wallet = await db('wallets').where('user_id', userId).first();
  return wallet.id as string;
}

async function addMfsAccount(token: string, overrides: Record<string, unknown> = {}) {
  return request
    .post('/api/v2/providers/payment-accounts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      mfs_type: MfsType.BKASH,
      account_number: '01711223344',
      account_name: 'Test Provider',
      is_primary: true,
      ...overrides,
    });
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

describe('Wallet & MFS account API — auth guards', () => {
  it('returns 401 on wallet endpoints without token', async () => {
    const [wallet, txns, withdraw] = await Promise.all([
      request.get('/api/v2/providers/wallet'),
      request.get('/api/v2/providers/wallet/transactions'),
      request.post('/api/v2/providers/wallet/withdraw').send({ amount_paisa: 10000 }),
    ]);
    expect(wallet.status).toBe(401);
    expect(txns.status).toBe(401);
    expect(withdraw.status).toBe(401);
  });

  it('returns 403 for resident on provider wallet endpoints', async () => {
    const resident = await createUser();
    const token = await loginAs(resident.mobile, resident.password);

    const res = await request
      .get('/api/v2/providers/wallet')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 on admin withdrawal endpoints without token', async () => {
    const [list, complete, reject] = await Promise.all([
      request.get('/api/v2/admin/withdrawals'),
      request.patch('/api/v2/admin/withdrawals/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000/complete').send({}),
      request.patch('/api/v2/admin/withdrawals/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000/reject').send({}),
    ]);
    expect(list.status).toBe(401);
    expect(complete.status).toBe(401);
    expect(reject.status).toBe(401);
  });

  it('returns 403 for provider on admin withdrawal endpoints', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .get('/api/v2/admin/withdrawals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── GET /providers/wallet ────────────────────────────────────────────────────

describe('GET /api/v2/providers/wallet', () => {
  it('returns zero balance when wallet has never been credited', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .get('/api/v2/providers/wallet')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.wallet.balance_paisa).toBe(0);
    expect(res.body.body.transactions).toHaveLength(0);
  });

  it('returns correct balance after wallet is credited', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    await seedWallet(provider.userId, 80_000);
    const token = await loginAs(provider.mobile, provider.password);

    const res = await request
      .get('/api/v2/providers/wallet')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.wallet.balance_paisa).toBe(80_000);
    expect(res.body.body.wallet.total_earned_paisa).toBe(80_000);
    expect(res.body.body.transactions).toHaveLength(1);
    expect(res.body.body.transactions[0].type).toBe('credit');
  });
});

// ─── MFS account CRUD ─────────────────────────────────────────────────────────

describe('Provider MFS account endpoints', () => {
  it('creates an account and auto-sets it as primary when first', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    const res = await addMfsAccount(token);

    expect(res.status).toBe(201);
    expect(res.body.body.mfs_type).toBe(MfsType.BKASH);
    expect(res.body.body.is_primary).toBe(true);
  });

  it('lists all registered accounts', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    await addMfsAccount(token);
    await addMfsAccount(token, { mfs_type: MfsType.NAGAD, account_number: '01811223344', is_primary: false });

    const res = await request
      .get('/api/v2/providers/payment-accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body).toHaveLength(2);
  });

  it('sets a different account as primary', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    await addMfsAccount(token);
    const second = await addMfsAccount(token, {
      mfs_type: MfsType.NAGAD,
      account_number: '01811223344',
      is_primary: false,
    });
    const secondId = second.body.body.id as string;

    const res = await request
      .patch(`/api/v2/providers/payment-accounts/${secondId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.body.is_primary).toBe(true);

    const db = getTestDb();
    const primaries = await db('provider_payment_accounts')
      .where('user_id', provider.userId)
      .where('is_primary', true);
    expect(primaries).toHaveLength(1);
    expect(primaries[0].id).toBe(secondId);
  });

  it('deletes a non-primary account', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    await addMfsAccount(token);
    const second = await addMfsAccount(token, {
      mfs_type: MfsType.NAGAD,
      account_number: '01811223344',
      is_primary: false,
    });
    const secondId = second.body.body.id as string;

    const res = await request
      .delete(`/api/v2/providers/payment-accounts/${secondId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const db = getTestDb();
    const [row] = await db('provider_payment_accounts').where('id', secondId);
    expect(row).toBeUndefined();
  });

  it('returns 400 when deleting the primary account', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    const created = await addMfsAccount(token);
    const id = created.body.body.id as string;

    const res = await request
      .delete(`/api/v2/providers/payment-accounts/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// ─── POST /providers/wallet/withdraw ─────────────────────────────────────────

describe('POST /api/v2/providers/wallet/withdraw', () => {
  it('creates a withdrawal request', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    await seedWallet(provider.userId, 50_000);
    await addMfsAccount(token);

    const res = await request
      .post('/api/v2/providers/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount_paisa: 30_000 });

    expect(res.status).toBe(201);
    expect(res.body.body.status).toBe(WithdrawalStatus.PENDING);
    expect(res.body.body.amount_requested_paisa).toBe(30_000);
  });

  it('returns 400 when amount is below minimum (৳100)', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    await seedWallet(provider.userId, 50_000);
    await addMfsAccount(token);

    const res = await request
      .post('/api/v2/providers/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount_paisa: 5_000 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when balance is insufficient', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    await seedWallet(provider.userId, 5_000);
    await addMfsAccount(token);

    const res = await request
      .post('/api/v2/providers/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount_paisa: 10_000 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when no MFS account is registered', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const token = await loginAs(provider.mobile, provider.password);

    await seedWallet(provider.userId, 50_000);

    const res = await request
      .post('/api/v2/providers/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount_paisa: 20_000 });

    expect(res.status).toBe(400);
  });
});

// ─── Admin withdrawal complete / reject ───────────────────────────────────────

describe('Admin withdrawal complete / reject', () => {
  async function createPendingWithdrawal(providerToken: string, amountPaisa: number) {
    const res = await request
      .post('/api/v2/providers/wallet/withdraw')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ amount_paisa: amountPaisa });
    return res.body.body as { id: string };
  }

  it('completing a withdrawal deducts balance and inserts wallet_transactions row', async () => {
    const admin = await createAdmin();
    const adminToken = await loginAs(admin.mobile, admin.password);

    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const providerToken = await loginAs(provider.mobile, provider.password);

    await seedWallet(provider.userId, 80_000);
    await addMfsAccount(providerToken);

    const withdrawal = await createPendingWithdrawal(providerToken, 50_000);

    const res = await request
      .patch(`/api/v2/admin/withdrawals/${withdrawal.id}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount_sent_paisa: 50_000,
        sent_at: new Date().toISOString(),
        admin_txid: 'ADMINBKASH123',
      });

    expect(res.status).toBe(200);
    expect(res.body.body.status).toBe(WithdrawalStatus.COMPLETED);
    expect(res.body.body.amount_sent_paisa).toBe(50_000);

    const db = getTestDb();
    const wallet = await db('wallets').where('user_id', provider.userId).first();
    expect(wallet.balance_paisa).toBe(30_000);
    expect(wallet.total_withdrawn_paisa).toBe(50_000);

    const txns = await db('wallet_transactions')
      .where('reference_id', withdrawal.id)
      .where('type', 'withdrawal');
    expect(txns).toHaveLength(1);
    expect(txns[0].amount_paisa).toBe(50_000);
  });

  it('rejecting a withdrawal leaves balance unchanged', async () => {
    const admin = await createAdmin();
    const adminToken = await loginAs(admin.mobile, admin.password);

    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const providerToken = await loginAs(provider.mobile, provider.password);

    await seedWallet(provider.userId, 80_000);
    await addMfsAccount(providerToken);

    const withdrawal = await createPendingWithdrawal(providerToken, 50_000);

    const res = await request
      .patch(`/api/v2/admin/withdrawals/${withdrawal.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ admin_note: 'Account details mismatch' });

    expect(res.status).toBe(200);
    expect(res.body.body.status).toBe(WithdrawalStatus.REJECTED);

    const db = getTestDb();
    const wallet = await db('wallets').where('user_id', provider.userId).first();
    expect(wallet.balance_paisa).toBe(80_000);
  });

  it('returns 400 when completing an already-completed withdrawal', async () => {
    const admin = await createAdmin();
    const adminToken = await loginAs(admin.mobile, admin.password);

    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const providerToken = await loginAs(provider.mobile, provider.password);

    await seedWallet(provider.userId, 80_000);
    await addMfsAccount(providerToken);

    const withdrawal = await createPendingWithdrawal(providerToken, 20_000);

    await request
      .patch(`/api/v2/admin/withdrawals/${withdrawal.id}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount_sent_paisa: 20_000, sent_at: new Date().toISOString(), admin_txid: 'TXN001' });

    const res = await request
      .patch(`/api/v2/admin/withdrawals/${withdrawal.id}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount_sent_paisa: 20_000, sent_at: new Date().toISOString(), admin_txid: 'TXN002' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent withdrawal', async () => {
    const admin = await createAdmin();
    const adminToken = await loginAs(admin.mobile, admin.password);

    const res = await request
      .patch('/api/v2/admin/withdrawals/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000/complete')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount_sent_paisa: 10_000, sent_at: new Date().toISOString(), admin_txid: 'TXN999' });

    expect(res.status).toBe(404);
  });

  it('lists all withdrawals', async () => {
    const admin = await createAdmin();
    const adminToken = await loginAs(admin.mobile, admin.password);

    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const providerToken = await loginAs(provider.mobile, provider.password);

    await seedWallet(provider.userId, 80_000);
    await addMfsAccount(providerToken);
    await createPendingWithdrawal(providerToken, 20_000);

    const res = await request
      .get('/api/v2/admin/withdrawals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.body.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Atomic transaction guarantee ─────────────────────────────────────────────

describe('Wallet atomic transaction — creditWallet', () => {
  it('wallet balance and transaction row are inserted together', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const category = await createCategory();
    const resident = await createUser();

    const job = await createJob({
      resident_id: resident.userId,
      category_id: category.id,
      provider_id: provider.userId,
      status: JobStatus.AWAITING_PAYMENT,
    });

    const db = getTestDb();
    const trx = await db.transaction();
    await WalletRepository.creditWallet(provider.userId, 80_000, job.id, trx);
    await trx.commit();

    const wallet = await db('wallets').where('user_id', provider.userId).first();
    expect(wallet.balance_paisa).toBe(80_000);

    const txns = await db('wallet_transactions').where('wallet_id', wallet.id);
    expect(txns).toHaveLength(1);
    expect(txns[0].type).toBe('credit');
    expect(txns[0].amount_paisa).toBe(80_000);
    expect(txns[0].reference_id).toBe(job.id);
  });

  it('rollback leaves wallet and transactions unchanged', async () => {
    const provider = await createUser({ role: UserRole.PROVIDER, status: UserStatus.ACTIVE });
    const db = getTestDb();

    const trx = await db.transaction();
    try {
      await WalletRepository.creditWallet(provider.userId, 80_000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380000', trx);
      await trx.rollback();
    } catch {
      // rollback throws — swallow
    }

    const wallet = await db('wallets').where('user_id', provider.userId).first();
    expect(wallet).toBeUndefined();
  });
});
