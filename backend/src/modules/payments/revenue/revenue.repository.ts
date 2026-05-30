import { PartialModelObject, TransactionOrKnex } from 'objection';
import { PlatformRevenueLedger } from './revenue.model';

export interface InsertRevenueLedgerInput {
  payment_id: string;
  commission_rule_id: string;
  amount_paisa: number;
}

export class RevenueLedgerRepository {
  static async insert(
    data: InsertRevenueLedgerInput,
    trx?: TransactionOrKnex
  ): Promise<PlatformRevenueLedger> {
    return PlatformRevenueLedger.query(trx).insertAndFetch(
      data as PartialModelObject<PlatformRevenueLedger>
    );
  }
}
