import { PartialModelObject, TransactionOrKnex } from 'objection';
import { CommissionRuleScope } from '@homefix/shared';
import { CommissionRule } from './commission.model';

export class CommissionRepository {
  static async resolveRule(
    categoryId: string | null,
    paymentDate: Date
  ): Promise<CommissionRule | undefined> {
    if (categoryId) {
      const promotion = await CommissionRule.query()
        .where('scope', CommissionRuleScope.PROMOTION)
        .where('category_id', categoryId)
        .where('is_active', true)
        .where((builder) =>
          builder.whereNull('valid_from').orWhere('valid_from', '<=', paymentDate)
        )
        .where((builder) =>
          builder.whereNull('valid_until').orWhere('valid_until', '>=', paymentDate)
        )
        .first();
      if (promotion) return promotion;

      const category = await CommissionRule.query()
        .where('scope', CommissionRuleScope.CATEGORY)
        .where('category_id', categoryId)
        .where('is_active', true)
        .first();
      if (category) return category;
    }

    return CommissionRule.query()
      .where('scope', CommissionRuleScope.GLOBAL)
      .where('is_active', true)
      .first();
  }

  static async findAll(): Promise<CommissionRule[]> {
    return CommissionRule.query().orderBy('created_at', 'desc');
  }

  static async findById(id: string): Promise<CommissionRule | undefined> {
    return CommissionRule.query().findById(id);
  }

  static async create(
    data: PartialModelObject<CommissionRule>,
    trx?: TransactionOrKnex
  ): Promise<CommissionRule> {
    return CommissionRule.query(trx).insertAndFetch(data);
  }

  static async patch(
    id: string,
    data: PartialModelObject<CommissionRule>,
    trx?: TransactionOrKnex
  ): Promise<CommissionRule | undefined> {
    return CommissionRule.query(trx).patchAndFetchById(id, data);
  }

  static async deactivate(id: string, trx?: TransactionOrKnex): Promise<void> {
    await CommissionRule.query(trx).patch({ is_active: false } as PartialModelObject<CommissionRule>).where('id', id);
  }

  static async deactivateActiveGlobal(trx?: TransactionOrKnex): Promise<void> {
    await CommissionRule.query(trx)
      .patch({ is_active: false } as PartialModelObject<CommissionRule>)
      .where('scope', CommissionRuleScope.GLOBAL)
      .where('is_active', true);
  }
}
