import { TransactionOrKnex } from 'objection';
import { WalletRepository } from './wallet.repository';

async function creditWallet(
  userId: string,
  amountPaisa: number,
  jobId: string,
  trx: TransactionOrKnex
): Promise<void> {
  await WalletRepository.creditWallet(userId, amountPaisa, jobId, trx);
}

export const WalletService = { creditWallet };
