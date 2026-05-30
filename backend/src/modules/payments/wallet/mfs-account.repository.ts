import { PartialModelObject } from 'objection';
import { ProviderPaymentAccount } from './wallet.model';

export class MfsAccountRepository {
  static async findByUserId(userId: string): Promise<ProviderPaymentAccount[]> {
    return ProviderPaymentAccount.query()
      .where('user_id', userId)
      .orderBy('is_primary', 'desc')
      .orderBy('created_at', 'asc');
  }

  static async findPrimaryByUserId(userId: string): Promise<ProviderPaymentAccount | undefined> {
    return ProviderPaymentAccount.query().findOne({ user_id: userId, is_primary: true });
  }

  static async findById(id: string): Promise<ProviderPaymentAccount | undefined> {
    return ProviderPaymentAccount.query().findById(id);
  }

  static async create(data: PartialModelObject<ProviderPaymentAccount>): Promise<ProviderPaymentAccount> {
    return ProviderPaymentAccount.query().insertAndFetch(data);
  }

  static async clearPrimary(userId: string): Promise<void> {
    await ProviderPaymentAccount.query()
      .patch({ is_primary: false } as PartialModelObject<ProviderPaymentAccount>)
      .where('user_id', userId);
  }

  static async setPrimary(id: string): Promise<ProviderPaymentAccount | undefined> {
    return ProviderPaymentAccount.query().patchAndFetchById(id, {
      is_primary: true,
    } as PartialModelObject<ProviderPaymentAccount>);
  }

  static async delete(id: string): Promise<number> {
    return ProviderPaymentAccount.query().deleteById(id);
  }

  static async countByUserId(userId: string): Promise<number> {
    const result = await ProviderPaymentAccount.query()
      .where('user_id', userId)
      .count('id as count')
      .first();
    return Number((result as unknown as { count: string }).count);
  }
}
