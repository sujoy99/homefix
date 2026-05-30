import { Model } from 'objection';
import { MfsType, WithdrawalStatus } from '@homefix/shared';

export class Wallet extends Model {
  static tableName = 'wallets';

  id!: string;
  user_id!: string;
  balance_paisa!: number;
  total_earned_paisa!: number;
  total_withdrawn_paisa!: number;
  updated_at!: string;
}

export class WalletTransaction extends Model {
  static tableName = 'wallet_transactions';

  id!: string;
  wallet_id!: string;
  type!: 'credit' | 'withdrawal';
  amount_paisa!: number;
  reference_id!: string;
  created_at!: string;
}

export class ProviderPaymentAccount extends Model {
  static tableName = 'provider_payment_accounts';

  id!: string;
  user_id!: string;
  mfs_type!: MfsType;
  account_number!: string;
  account_name!: string;
  is_primary!: boolean;
  created_at!: string;
  updated_at!: string;
}

export class WithdrawalRequest extends Model {
  static tableName = 'withdrawal_requests';

  id!: string;
  wallet_id!: string;
  provider_id!: string;
  mfs_account_id!: string;
  amount_requested_paisa!: number;
  status!: WithdrawalStatus;
  requested_at!: string;
  amount_sent_paisa!: number | null;
  sent_at!: string | null;
  admin_txid!: string | null;
  processed_by_admin_id!: string | null;
  admin_note!: string | null;
  processed_at!: string | null;
}
