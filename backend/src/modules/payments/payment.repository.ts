import { PartialModelObject, TransactionOrKnex } from 'objection';
import { Payment } from './payment.model';
import { PaymentMethod, PaymentStatus } from '@homefix/shared';

export interface CreatePaymentInput {
  job_id: string;
  resident_id: string;
  provider_id: string;
  amount_paisa: number;
  method: PaymentMethod;
  transaction_id?: string;
}

export class PaymentRepository {
  static async create(data: CreatePaymentInput, trx?: TransactionOrKnex): Promise<Payment> {
    return Payment.query(trx).insertAndFetch({
      job_id: data.job_id,
      resident_id: data.resident_id,
      provider_id: data.provider_id,
      amount_paisa: data.amount_paisa,
      method: data.method,
      transaction_id: data.transaction_id ?? null,
      status: PaymentStatus.SUBMITTED,
    } as PartialModelObject<Payment>);
  }

  static async findById(id: string): Promise<Payment | undefined> {
    return Payment.query().findById(id);
  }

  static async findByJobId(jobId: string): Promise<Payment | undefined> {
    return Payment.query().findOne({ job_id: jobId });
  }

  static async verify(
    id: string,
    adminId: string,
    trx?: TransactionOrKnex
  ): Promise<Payment | undefined> {
    return Payment.query(trx).patchAndFetchById(id, {
      status: PaymentStatus.VERIFIED,
      verified_at: new Date().toISOString(),
      verified_by_admin_id: adminId,
    } as PartialModelObject<Payment>);
  }
}
