import { createPaymentSchema } from '../../../src/modules/payments/payment.schema';
import { PaymentMethod } from '@homefix/shared';

function parse(body: Record<string, unknown>) {
  return createPaymentSchema.safeParse({ body });
}

const BASE = {
  job_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  method: PaymentMethod.BKASH,
  transaction_id: 'TXN1234567',
  amount_paisa: 100000,
};

describe('createPaymentSchema — TxID format', () => {
  it('accepts alphanumeric TxID of 8 chars', () => {
    expect(parse({ ...BASE, transaction_id: 'ABCD1234' }).success).toBe(true);
  });

  it('accepts alphanumeric TxID of 20 chars', () => {
    expect(parse({ ...BASE, transaction_id: 'A1B2C3D4E5F6G7H8I9J0' }).success).toBe(true);
  });

  it('rejects TxID shorter than 8 chars', () => {
    const result = parse({ ...BASE, transaction_id: 'ABC123' });
    expect(result.success).toBe(false);
  });

  it('rejects TxID longer than 20 chars', () => {
    const result = parse({ ...BASE, transaction_id: 'A'.repeat(21) });
    expect(result.success).toBe(false);
  });

  it('rejects TxID with special characters', () => {
    const result = parse({ ...BASE, transaction_id: 'TXN-123456' });
    expect(result.success).toBe(false);
  });

  it('rejects TxID with spaces', () => {
    const result = parse({ ...BASE, transaction_id: 'TXN 123456' });
    expect(result.success).toBe(false);
  });
});

describe('createPaymentSchema — transaction_id required for MFS methods', () => {
  it('rejects bKash payment without transaction_id', () => {
    const result = parse({ job_id: BASE.job_id, method: PaymentMethod.BKASH, amount_paisa: 100000 });
    expect(result.success).toBe(false);
  });

  it('rejects Nagad payment without transaction_id', () => {
    const result = parse({ job_id: BASE.job_id, method: PaymentMethod.NAGAD, amount_paisa: 100000 });
    expect(result.success).toBe(false);
  });

  it('rejects bank_transfer without transaction_id', () => {
    const result = parse({ job_id: BASE.job_id, method: PaymentMethod.BANK_TRANSFER, amount_paisa: 100000 });
    expect(result.success).toBe(false);
  });

  it('accepts cash payment without transaction_id', () => {
    const result = parse({ job_id: BASE.job_id, method: PaymentMethod.CASH, amount_paisa: 100000 });
    expect(result.success).toBe(true);
  });

  it('accepts card payment without transaction_id', () => {
    const result = parse({ job_id: BASE.job_id, method: PaymentMethod.CARD, amount_paisa: 100000 });
    expect(result.success).toBe(true);
  });
});

describe('createPaymentSchema — amount_paisa', () => {
  it('rejects zero amount', () => {
    expect(parse({ ...BASE, amount_paisa: 0 }).success).toBe(false);
  });

  it('rejects negative amount', () => {
    expect(parse({ ...BASE, amount_paisa: -1000 }).success).toBe(false);
  });

  it('rejects decimal amount', () => {
    expect(parse({ ...BASE, amount_paisa: 100.5 }).success).toBe(false);
  });

  it('accepts a valid positive integer', () => {
    expect(parse({ ...BASE, amount_paisa: 50000 }).success).toBe(true);
  });
});

describe('createPaymentSchema — job_id', () => {
  it('rejects non-UUID job_id', () => {
    expect(parse({ ...BASE, job_id: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects missing job_id', () => {
    const { job_id: _, ...rest } = BASE;
    expect(parse(rest).success).toBe(false);
  });
});
