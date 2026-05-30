import { transaction } from 'objection';
import { TransactionOrKnex } from 'objection';
import { WalletRepository } from './wallet.repository';
import { WithdrawalRepository } from './withdrawal.repository';
import { MfsAccountRepository } from './mfs-account.repository';
import { Wallet, WalletTransaction, WithdrawalRequest } from './wallet.model';
import { BadRequestError, NotFoundError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';

const WITHDRAWAL_MIN_PAISA = 10_000; // ৳100

async function creditWallet(
  userId: string,
  amountPaisa: number,
  jobId: string,
  trx: TransactionOrKnex
): Promise<void> {
  await WalletRepository.creditWallet(userId, amountPaisa, jobId, trx);
}

async function getWalletWithHistory(userId: string): Promise<{
  wallet: Wallet;
  transactions: WalletTransaction[];
  nextCursor: string | null;
}> {
  let wallet = await WalletRepository.findByUserId(userId);
  if (!wallet) {
    wallet = { balance_paisa: 0, total_earned_paisa: 0, total_withdrawn_paisa: 0 } as Wallet;
    return { wallet, transactions: [], nextCursor: null };
  }

  const { transactions, nextCursor } = await WalletRepository.findTransactions(wallet.id);
  return { wallet, transactions, nextCursor };
}

async function getTransactions(
  userId: string,
  cursor?: string
): Promise<{ transactions: WalletTransaction[]; nextCursor: string | null }> {
  const wallet = await WalletRepository.findByUserId(userId);
  if (!wallet) return { transactions: [], nextCursor: null };
  return WalletRepository.findTransactions(wallet.id, cursor);
}

async function requestWithdrawal(
  userId: string,
  amountPaisa: number
): Promise<WithdrawalRequest> {
  if (amountPaisa < WITHDRAWAL_MIN_PAISA) {
    throw new BadRequestError(
      ErrorCode.WITHDRAWAL_MIN_AMOUNT,
      `Minimum withdrawal is ৳${WITHDRAWAL_MIN_PAISA / 100}`
    );
  }

  const mfsAccount = await MfsAccountRepository.findPrimaryByUserId(userId);
  if (!mfsAccount) {
    throw new BadRequestError(ErrorCode.NO_MFS_ACCOUNT, 'No registered MFS account found');
  }

  const wallet = await WalletRepository.findByUserId(userId);
  if (!wallet || wallet.balance_paisa < amountPaisa) {
    throw new BadRequestError(ErrorCode.INSUFFICIENT_WALLET_BALANCE, 'Insufficient wallet balance');
  }

  return WithdrawalRepository.create({
    wallet_id: wallet.id,
    provider_id: userId,
    mfs_account_id: mfsAccount.id,
    amount_requested_paisa: amountPaisa,
  });
}

async function completeWithdrawal(
  withdrawalId: string,
  adminId: string,
  data: { amount_sent_paisa: number; sent_at: string; admin_txid: string; admin_note?: string | undefined }
): Promise<WithdrawalRequest> {
  const withdrawal = await WithdrawalRepository.findById(withdrawalId);
  if (!withdrawal) {
    throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Withdrawal request not found');
  }
  if (withdrawal.status !== 'pending') {
    throw new BadRequestError(ErrorCode.INVALID_PAYMENT_STATE, 'Withdrawal is already processed');
  }

  return transaction(Wallet.knex(), async (trx) => {
    await WalletRepository.deductForWithdrawal(
      withdrawal.wallet_id,
      data.amount_sent_paisa,
      withdrawalId,
      trx
    );

    const updated = await WithdrawalRepository.complete(
      withdrawalId,
      {
        amount_sent_paisa: data.amount_sent_paisa,
        sent_at: data.sent_at,
        admin_txid: data.admin_txid,
        processed_by_admin_id: adminId,
        admin_note: data.admin_note,
      },
      trx
    );

    if (!updated) throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Withdrawal request not found');
    return updated;
  });
}

async function rejectWithdrawal(
  withdrawalId: string,
  adminId: string,
  adminNote: string
): Promise<WithdrawalRequest> {
  const withdrawal = await WithdrawalRepository.findById(withdrawalId);
  if (!withdrawal) {
    throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Withdrawal request not found');
  }
  if (withdrawal.status !== 'pending') {
    throw new BadRequestError(ErrorCode.INVALID_PAYMENT_STATE, 'Withdrawal is already processed');
  }

  const updated = await WithdrawalRepository.reject(withdrawalId, adminId, adminNote);
  if (!updated) throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Withdrawal request not found');
  return updated;
}

export const WalletService = {
  creditWallet,
  getWalletWithHistory,
  getTransactions,
  requestWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
};
