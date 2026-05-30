import { PartialModelObject, TransactionOrKnex } from 'objection';
import { WithdrawalRequest } from './wallet.model';
import { WithdrawalStatus } from '@homefix/shared';

export interface CreateWithdrawalInput {
  wallet_id: string;
  provider_id: string;
  mfs_account_id: string;
  amount_requested_paisa: number;
}

export interface CompleteWithdrawalInput {
  amount_sent_paisa: number;
  sent_at: string;
  admin_txid: string;
  processed_by_admin_id: string;
  admin_note?: string | undefined;
}

export class WithdrawalRepository {
  static async create(data: CreateWithdrawalInput): Promise<WithdrawalRequest> {
    return WithdrawalRequest.query().insertAndFetch({
      ...data,
      status: WithdrawalStatus.PENDING,
      requested_at: new Date().toISOString(),
    } as PartialModelObject<WithdrawalRequest>);
  }

  static async findById(id: string): Promise<WithdrawalRequest | undefined> {
    return WithdrawalRequest.query().findById(id);
  }

  static async listPending(): Promise<WithdrawalRequest[]> {
    return WithdrawalRequest.query()
      .where('status', WithdrawalStatus.PENDING)
      .orderBy('requested_at', 'asc');
  }

  static async listAll(): Promise<WithdrawalRequest[]> {
    return WithdrawalRequest.query().orderBy('requested_at', 'desc');
  }

  static async complete(
    id: string,
    data: CompleteWithdrawalInput,
    trx?: TransactionOrKnex
  ): Promise<WithdrawalRequest | undefined> {
    return WithdrawalRequest.query(trx).patchAndFetchById(id, {
      status: WithdrawalStatus.COMPLETED,
      amount_sent_paisa: data.amount_sent_paisa,
      sent_at: data.sent_at,
      admin_txid: data.admin_txid,
      processed_by_admin_id: data.processed_by_admin_id,
      admin_note: data.admin_note ?? null,
      processed_at: new Date().toISOString(),
    } as PartialModelObject<WithdrawalRequest>);
  }

  static async reject(
    id: string,
    adminId: string,
    adminNote: string,
    trx?: TransactionOrKnex
  ): Promise<WithdrawalRequest | undefined> {
    return WithdrawalRequest.query(trx).patchAndFetchById(id, {
      status: WithdrawalStatus.REJECTED,
      processed_by_admin_id: adminId,
      admin_note: adminNote,
      processed_at: new Date().toISOString(),
    } as PartialModelObject<WithdrawalRequest>);
  }
}
