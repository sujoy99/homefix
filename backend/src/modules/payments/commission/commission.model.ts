import { Model } from 'objection';
import { CommissionRuleScope } from '@homefix/shared';

export class CommissionRule extends Model {
  static tableName = 'commission_rules';

  id!: string;
  scope!: CommissionRuleScope;
  category_id!: string | null;
  rate!: string; // DECIMAL(5,4) comes back as string from pg
  label!: string;
  is_active!: boolean;
  valid_from!: Date | null;
  valid_until!: Date | null;
  created_by_admin_id!: string;
  created_at!: Date;
  updated_at!: Date;
}
