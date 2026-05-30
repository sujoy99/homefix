import { CommissionRuleScope, MfsType, PaymentMethod, PaymentStatus, WithdrawalStatus } from '@homefix/shared';

export interface PaymentRow {
  id: string;
  job_id: string;
  resident_id: string;
  provider_id: string;
  amount_paisa: number;
  commission_rate: string; // DECIMAL comes back as string from pg
  commission_rule_id: string | null;
  platform_fee_paisa: number;
  provider_net_paisa: number;
  method: PaymentMethod;
  transaction_id: string | null;
  status: PaymentStatus;
  created_at: Date;
  verified_at: Date | null;
  verified_by_admin_id: string | null;
}

export interface CommissionRuleRow {
  id: string;
  scope: CommissionRuleScope;
  category_id: string | null;
  rate: string; // DECIMAL as string
  label: string;
  is_active: boolean;
  valid_from: Date | null;
  valid_until: Date | null;
  created_by_admin_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface WalletRow {
  id: string;
  user_id: string;
  balance_paisa: number;
  total_earned_paisa: number;
  total_withdrawn_paisa: number;
  updated_at: Date;
}

export interface WalletTransactionRow {
  id: string;
  wallet_id: string;
  type: 'credit' | 'withdrawal';
  amount_paisa: number;
  reference_id: string;
  created_at: Date;
}

export interface PlatformRevenueLedgerRow {
  id: string;
  payment_id: string;
  commission_rule_id: string;
  amount_paisa: number;
  created_at: Date;
}

export interface ProviderPaymentAccountRow {
  id: string;
  user_id: string;
  mfs_type: MfsType;
  account_number: string;
  account_name: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WithdrawalRequestRow {
  id: string;
  wallet_id: string;
  provider_id: string;
  mfs_account_id: string;
  amount_requested_paisa: number;
  status: WithdrawalStatus;
  requested_at: Date;
  amount_sent_paisa: number | null;
  sent_at: Date | null;
  admin_txid: string | null;
  processed_by_admin_id: string | null;
  admin_note: string | null;
  processed_at: Date | null;
}

/** Resolved commission rate with its source rule. */
export interface ResolvedCommission {
  rate: number;
  commissionRuleId: string;
  label: string;
}
