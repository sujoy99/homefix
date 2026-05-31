import { Model } from 'objection';

export class PlatformRevenueLedger extends Model {
  static tableName = 'platform_revenue_ledger';

  id!: string;
  payment_id!: string;
  commission_rule_id!: string;
  amount_paisa!: number;
  created_at!: Date;
}
