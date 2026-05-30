import { PartialModelObject, TransactionOrKnex } from 'objection';
import { Wallet, WalletTransaction } from './wallet.model';

const TRANSACTIONS_PAGE_SIZE = 20;

export class WalletRepository {
  static async creditWallet(
    userId: string,
    amountPaisa: number,
    jobId: string,
    trx: TransactionOrKnex
  ): Promise<void> {
    const existing = await Wallet.query(trx).findOne({ user_id: userId });

    let walletId: string;
    if (existing) {
      await Wallet.query(trx)
        .patch({
          balance_paisa: existing.balance_paisa + amountPaisa,
          total_earned_paisa: existing.total_earned_paisa + amountPaisa,
          updated_at: new Date().toISOString(),
        } as PartialModelObject<Wallet>)
        .where('id', existing.id);
      walletId = existing.id;
    } else {
      const wallet = await Wallet.query(trx).insertAndFetch({
        user_id: userId,
        balance_paisa: amountPaisa,
        total_earned_paisa: amountPaisa,
        total_withdrawn_paisa: 0,
      } as PartialModelObject<Wallet>);
      walletId = wallet.id;
    }

    await WalletTransaction.query(trx).insert({
      wallet_id: walletId,
      type: 'credit',
      amount_paisa: amountPaisa,
      reference_id: jobId,
    } as PartialModelObject<WalletTransaction>);
  }

  static async deductForWithdrawal(
    walletId: string,
    amountPaisa: number,
    withdrawalRequestId: string,
    trx: TransactionOrKnex
  ): Promise<void> {
    const wallet = await Wallet.query(trx).findById(walletId);
    if (!wallet) return;

    await Wallet.query(trx)
      .patch({
        balance_paisa: wallet.balance_paisa - amountPaisa,
        total_withdrawn_paisa: wallet.total_withdrawn_paisa + amountPaisa,
        updated_at: new Date().toISOString(),
      } as PartialModelObject<Wallet>)
      .where('id', walletId);

    await WalletTransaction.query(trx).insert({
      wallet_id: walletId,
      type: 'withdrawal',
      amount_paisa: amountPaisa,
      reference_id: withdrawalRequestId,
    } as PartialModelObject<WalletTransaction>);
  }

  static async findByUserId(userId: string): Promise<Wallet | undefined> {
    return Wallet.query().findOne({ user_id: userId });
  }

  static async findTransactions(
    walletId: string,
    cursor?: string
  ): Promise<{ transactions: WalletTransaction[]; nextCursor: string | null }> {
    let query = WalletTransaction.query()
      .where('wallet_id', walletId)
      .orderBy('created_at', 'desc')
      .limit(TRANSACTIONS_PAGE_SIZE + 1);

    if (cursor) {
      query = query.where('created_at', '<', cursor);
    }

    const rows = await query;
    const hasMore = rows.length > TRANSACTIONS_PAGE_SIZE;
    const transactions = hasMore ? rows.slice(0, TRANSACTIONS_PAGE_SIZE) : rows;
    const nextCursor = hasMore ? (transactions[transactions.length - 1]?.created_at ?? null) : null;

    return { transactions, nextCursor };
  }
}
