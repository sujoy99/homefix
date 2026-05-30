import { Model } from 'objection';

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
