import { apiClient } from '@/api/client';
import { PaymentMethod } from '@homefix/shared';
import type { MfsType } from '@homefix/shared';

type ApiResponse<T> = { status: string; body: T };

// ─── Payment ──────────────────────────────────────────────────────────────────

export type Payment = {
  id: string;
  job_id: string;
  resident_id: string;
  method: PaymentMethod;
  transaction_id: string | null;
  amount_paisa: number;
  status: string;
  created_at: string;
};

export type SubmitPaymentPayload = {
  job_id: string;
  method: PaymentMethod;
  transaction_id?: string;
  amount_paisa: number;
};

// ─── Wallet ──────────────────────────────────────────────────────────────────

export type Wallet = {
  id: string;
  user_id: string;
  balance_paisa: number;
  total_earned_paisa: number;
  total_withdrawn_paisa: number;
  updated_at: string;
};

export type WalletTransaction = {
  id: string;
  wallet_id: string;
  type: 'credit' | 'withdrawal';
  amount_paisa: number;
  reference_id: string;
  created_at: string;
};

export type WalletResponse = {
  wallet: Wallet;
  transactions: WalletTransaction[];
  next_cursor: string | null;
};

export type WithdrawalRequest = {
  id: string;
  amount_requested_paisa: number;
  status: 'pending' | 'completed' | 'rejected';
  requested_at: string;
  amount_sent_paisa: number | null;
  processed_at: string | null;
  admin_note: string | null;
  mfs_account_id: string;
};

export type MyWithdrawalsResponse = {
  withdrawals: WithdrawalRequest[];
  pending_total_paisa: number;
};

// ─── MFS Accounts ─────────────────────────────────────────────────────────────

export type MfsAccount = {
  id: string;
  mfs_type: MfsType;
  account_number: string;
  account_name: string;
  is_primary: boolean;
  created_at: string;
};

export type CreateMfsAccountPayload = {
  mfs_type: MfsType;
  account_number: string;
  account_name: string;
  is_primary?: boolean;
};

// ─── Profile Completion ───────────────────────────────────────────────────────

export type CompletionItem = {
  key: string;
  label_key: string;
  weight: number;
};

export type ProfileCompletionResult = {
  percentage: number;
  meets_threshold: boolean;
  threshold: number | null;
  missing_items: CompletionItem[];
  completed_items: CompletionItem[];
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const paymentService = {
  submitPayment: async (data: SubmitPaymentPayload): Promise<Payment> => {
    const res = await apiClient.post<ApiResponse<Payment>>('/v2/payments', data);
    return res.data.body;
  },

  getWallet: async (): Promise<WalletResponse> => {
    const res = await apiClient.get<ApiResponse<WalletResponse>>('/v2/providers/wallet');
    return res.data.body;
  },

  getTransactions: async (cursor?: string): Promise<{ transactions: WalletTransaction[]; next_cursor: string | null }> => {
    const res = await apiClient.get<ApiResponse<{ transactions: WalletTransaction[]; next_cursor: string | null }>>(
      '/v2/providers/wallet/transactions',
      { params: cursor ? { cursor } : undefined }
    );
    return res.data.body;
  },

  requestWithdrawal: async (payload: { amount_paisa: number; mfs_account_id: string }): Promise<WithdrawalRequest> => {
    const res = await apiClient.post<ApiResponse<WithdrawalRequest>>('/v2/providers/wallet/withdraw', payload);
    return res.data.body;
  },

  getMyWithdrawals: async (): Promise<MyWithdrawalsResponse> => {
    const res = await apiClient.get<ApiResponse<MyWithdrawalsResponse>>('/v2/providers/wallet/withdrawals');
    return res.data.body;
  },

  listMfsAccounts: async (): Promise<MfsAccount[]> => {
    const res = await apiClient.get<ApiResponse<MfsAccount[]>>('/v2/providers/payment-accounts');
    return res.data.body;
  },

  addMfsAccount: async (data: CreateMfsAccountPayload): Promise<MfsAccount> => {
    const res = await apiClient.post<ApiResponse<MfsAccount>>('/v2/providers/payment-accounts', data);
    return res.data.body;
  },

  setPrimaryMfsAccount: async (id: string): Promise<MfsAccount> => {
    const res = await apiClient.patch<ApiResponse<MfsAccount>>(`/v2/providers/payment-accounts/${id}`);
    return res.data.body;
  },

  deleteMfsAccount: async (id: string): Promise<void> => {
    await apiClient.delete(`/v2/providers/payment-accounts/${id}`);
  },

  getProfileCompletion: async (): Promise<ProfileCompletionResult> => {
    const res = await apiClient.get<ApiResponse<ProfileCompletionResult>>('/v2/users/me/profile-completion');
    return res.data.body;
  },
};
