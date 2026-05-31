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
  static async sumPendingByWalletId(walletId: string): Promise<number> {
    const result = await WithdrawalRequest.query()
      .where('wallet_id', walletId)
      .where('status', WithdrawalStatus.PENDING)
      .sum('amount_requested_paisa as total')
      .first();
    return Number((result as unknown as { total: string | null })?.total ?? 0);
  }

  static async listByWalletId(walletId: string): Promise<WithdrawalRequest[]> {
    return WithdrawalRequest.query()
      .where('wallet_id', walletId)
      .orderBy('requested_at', 'desc');
  }

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
      .withGraphFetched('[provider(nameOnly), mfsAccount(accountFields), wallet(balanceOnly)]')
      .modifiers({
        nameOnly: (q) => q.select('id', 'full_name', 'mobile'),
        accountFields: (q) => q.select('id', 'mfs_type', 'account_number', 'account_name'),
        balanceOnly: (q) => q.select('id', 'balance_paisa'),
      })
      .orderBy('requested_at', 'asc');
  }

  static async listAll(): Promise<(WithdrawalRequest & { total_pending_paisa: number })[]> {
    const rows = await WithdrawalRequest.query()
      .select(
        'withdrawal_requests.*',
        WithdrawalRequest.knex().raw(
          `COALESCE((SELECT SUM(wr2.amount_requested_paisa) FROM withdrawal_requests wr2 WHERE wr2.wallet_id = withdrawal_requests.wallet_id AND wr2.status = 'pending'), 0) AS total_pending_paisa`
        )
      )
      .withGraphFetched('[provider(nameOnly), mfsAccount(accountFields), wallet(balanceOnly)]')
      .modifiers({
        nameOnly: (q) => q.select('id', 'full_name', 'mobile'),
        accountFields: (q) => q.select('id', 'mfs_type', 'account_number', 'account_name'),
        balanceOnly: (q) => q.select('id', 'balance_paisa'),
      })
      .orderBy('requested_at', 'desc');
    return rows.map((r) => ({
      ...r,
      total_pending_paisa: Number((r as unknown as { total_pending_paisa: string }).total_pending_paisa ?? 0),
    })) as (WithdrawalRequest & { total_pending_paisa: number })[];
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
