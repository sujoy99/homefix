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

export interface CommissionFieldsInput {
  commission_rate: string;
  commission_rule_id: string;
  platform_fee_paisa: number;
  provider_net_paisa: number;
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

  static async findById(id: string, trx?: TransactionOrKnex): Promise<Payment | undefined> {
    return Payment.query(trx).findById(id);
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

  static async findByJobIds(jobIds: string[]): Promise<Record<string, Payment>> {
    if (jobIds.length === 0) return {};
    const rows = await Payment.query().whereIn('job_id', jobIds);
    return Object.fromEntries(rows.map((p) => [p.job_id, p]));
  }

  static async listPendingWithDetails(): Promise<Record<string, unknown>[]> {
    return Payment.knex()
      .select(
        'payments.*',
        'jobs.title as job_title',
        'jobs.category_id',
        'categories.name as category_name',
        'residents.full_name as resident_name',
        'residents.mobile as resident_mobile',
      )
      .from('payments')
      .join('jobs', 'jobs.id', 'payments.job_id')
      .join('categories', 'categories.id', 'jobs.category_id')
      .join('users as residents', 'residents.id', 'payments.resident_id')
      .where('payments.status', 'submitted')
      .orderBy('payments.created_at', 'asc');
  }

  static async applyCommissionFields(
    id: string,
    fields: CommissionFieldsInput,
    trx?: TransactionOrKnex
  ): Promise<void> {
    await Payment.query(trx).patch({
      commission_rate: fields.commission_rate,
      commission_rule_id: fields.commission_rule_id,
      platform_fee_paisa: fields.platform_fee_paisa,
      provider_net_paisa: fields.provider_net_paisa,
    } as PartialModelObject<Payment>).where('id', id);
  }
}
