import { PartialModelObject, TransactionOrKnex } from 'objection';
import { Wallet, WalletTransaction } from './wallet.model';

export class WalletRepository {
  /**
   * Upserts a provider wallet and appends a credit transaction row.
   * Must be called within an existing DB transaction (trx) so the wallet
   * balance update and payment verification are atomic.
   */
  static async creditWallet(
    userId: string,
    amountPaisa: number,
    jobId: string,
    trx: TransactionOrKnex
  ): Promise<void> {
    const existing = await Wallet.query(trx).findOne({ user_id: userId });

    let walletId: string;
    if (existing) {
      await Wallet.query(trx).patch({
        balance_paisa: existing.balance_paisa + amountPaisa,
        total_earned_paisa: existing.total_earned_paisa + amountPaisa,
        updated_at: new Date().toISOString(),
      } as PartialModelObject<Wallet>).where('id', existing.id);
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

  static async findByUserId(userId: string): Promise<Wallet | undefined> {
    return Wallet.query().findOne({ user_id: userId });
  }
}
