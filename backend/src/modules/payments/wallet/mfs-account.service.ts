import { transaction } from 'objection';
import { MfsAccountRepository } from './mfs-account.repository';
import { ProviderPaymentAccount } from './wallet.model';
import { BadRequestError, NotFoundError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';
import { MfsType } from '@homefix/shared';

export interface CreateMfsAccountInput {
  mfs_type: MfsType;
  account_number: string;
  account_name: string;
  is_primary?: boolean | undefined;
}

async function listAccounts(userId: string): Promise<ProviderPaymentAccount[]> {
  return MfsAccountRepository.findByUserId(userId);
}

async function createAccount(
  userId: string,
  data: CreateMfsAccountInput
): Promise<ProviderPaymentAccount> {
  const count = await MfsAccountRepository.countByUserId(userId);
  const isFirst = count === 0;
  const makePrimary = data.is_primary ?? isFirst;

  return transaction(ProviderPaymentAccount.knex(), async (trx) => {
    if (makePrimary) {
      await MfsAccountRepository.clearPrimary(userId, trx);
    }

    return MfsAccountRepository.create({
      user_id: userId,
      mfs_type: data.mfs_type,
      account_number: data.account_number,
      account_name: data.account_name,
      is_primary: makePrimary,
    }, trx);
  });
}

async function setPrimary(userId: string, accountId: string): Promise<ProviderPaymentAccount> {
  const account = await MfsAccountRepository.findById(accountId);
  if (!account || account.user_id !== userId) {
    throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Payment account not found');
  }

  return transaction(ProviderPaymentAccount.knex(), async (trx) => {
    await MfsAccountRepository.clearPrimary(userId, trx);
    const updated = await MfsAccountRepository.setPrimary(accountId, trx);
    if (!updated) throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Payment account not found');
    return updated;
  });
}

async function deleteAccount(userId: string, accountId: string): Promise<void> {
  const account = await MfsAccountRepository.findById(accountId);
  if (!account || account.user_id !== userId) {
    throw new NotFoundError(ErrorCode.RESOURCE_NOT_FOUND, 'Payment account not found');
  }
  if (account.is_primary) {
    throw new BadRequestError(ErrorCode.BAD_REQUEST, 'Cannot delete primary account — set another account as primary first');
  }

  await MfsAccountRepository.delete(accountId);
}

export const MfsAccountService = {
  listAccounts,
  createAccount,
  setPrimary,
  deleteAccount,
};
