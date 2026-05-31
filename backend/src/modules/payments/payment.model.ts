import { Model } from 'objection';
import { PaymentMethod, PaymentStatus } from '@homefix/shared';

export class Payment extends Model {
  static tableName = 'payments';

  id!: string;
  job_id!: string;
  resident_id!: string;
  provider_id!: string;
  amount_paisa!: number;
  commission_rate!: string | null;
  commission_rule_id!: string | null;
  platform_fee_paisa!: number | null;
  provider_net_paisa!: number | null;
  method!: PaymentMethod;
  transaction_id!: string | null;
  status!: PaymentStatus;
  created_at!: string;
  verified_at!: string | null;
  verified_by_admin_id!: string | null;
}
