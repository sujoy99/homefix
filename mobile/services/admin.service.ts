import { apiClient } from '@/api/client';

export type PendingProvider = {
  id: string;
  full_name: string;
  mobile: string;
  email: string | null;
  nid: string;
  status: string;
  created_at: string;
  photo_url: string | null;
  nid_photo_url: string | null;
  nid_photo_back_url: string | null;
};

export type ProviderSkill = {
  id: string;
  category_id: string;
  category_name: string | null;
  category_name_bn: string | null;
};

export type ProviderDetail = PendingProvider & {
  bio: string | null;
  skills: ProviderSkill[];
};

type ApiResponse<T> = { status: string; body: T };

// ─── Financial summary ────────────────────────────────────────────────────────

export type FinancialSummary = {
  total_payments_paisa: number;
  pending_payments_paisa: number;
  platform_revenue_paisa: number;
  provider_wallet_balance_paisa: number;
  provider_withdrawn_paisa: number;
  provider_withdrawal_pending_paisa: number;
};

// ─── Revenue types ────────────────────────────────────────────────────────────

export type RevenuePeriodRow = {
  date: string;
  total_paisa: number;
};

export type RevenueRuleRow = {
  rule_id: string;
  label: string;
  scope: string;
  rate: string;
  total_paisa: number;
};

export type RevenueCategoryRow = {
  category_id: string;
  name: string;
  slug: string;
  total_paisa: number;
};

export type RevenueDashboard = {
  total_revenue_paisa: number;
  revenue_by_period: RevenuePeriodRow[];
  breakdown_by_rule: RevenueRuleRow[];
  top_categories: RevenueCategoryRow[];
};

export type RevenueJobRow = {
  ledger_id: string;
  payment_id: string;
  job_id: string;
  revenue_paisa: number;
  payment_amount_paisa: number;
  commission_rate: string;
  method: string;
  rule_label: string;
  rule_scope: string;
  category_name: string;
  created_at: string;
  verified_at: string | null;
};

export type RevenueJobsResponse = {
  items: RevenueJobRow[];
  nextCursor: string | null;
};

// ─── Withdrawal types ─────────────────────────────────────────────────────────

export type WithdrawalItem = {
  id: string;
  wallet_id: string;
  provider_id: string;
  mfs_account_id: string;
  amount_requested_paisa: number;
  status: 'pending' | 'completed' | 'rejected';
  requested_at: string;
  amount_sent_paisa: number | null;
  sent_at: string | null;
  admin_txid: string | null;
  admin_note: string | null;
  processed_at: string | null;
  provider?: { id: string; full_name: string; mobile: string };
  mfsAccount?: { id: string; mfs_type: string; account_number: string; account_name: string };
  wallet?: { id: string; balance_paisa: number };
  total_pending_paisa?: number;
};

export type CompleteWithdrawalPayload = {
  amount_sent_paisa: number;
  sent_at: string;
  admin_txid: string;
  admin_note?: string;
};

// ─── Payment verification types ───────────────────────────────────────────────

export type PendingPayment = {
  id: string;
  job_id: string;
  job_title: string | null;
  category_name: string;
  resident_name: string;
  resident_mobile: string;
  amount_paisa: number;
  method: string;
  transaction_id: string | null;
  status: string;
  created_at: string;
};

export const adminService = {
  listPending: async (): Promise<PendingProvider[]> => {
    const res = await apiClient.get<ApiResponse<PendingProvider[]>>(
      '/v2/admin/providers/pending'
    );
    return res.data.body;
  },

  getProviderDetail: async (providerId: string): Promise<ProviderDetail> => {
    const res = await apiClient.get<ApiResponse<ProviderDetail>>(`/v2/admin/providers/${providerId}`);
    return res.data.body;
  },

  approve: async (providerId: string): Promise<void> => {
    await apiClient.post(`/v2/admin/providers/${providerId}/approve`);
  },

  reject: async (providerId: string): Promise<void> => {
    await apiClient.post(`/v2/admin/providers/${providerId}/reject`);
  },

  getRevenueDashboard: async (params?: { period?: 'daily' | 'monthly'; from?: string; to?: string }): Promise<RevenueDashboard> => {
    const res = await apiClient.get<ApiResponse<RevenueDashboard>>('/v2/admin/revenue', { params });
    return res.data.body;
  },

  getRevenueJobs: async (cursor?: string): Promise<RevenueJobsResponse> => {
    const res = await apiClient.get<ApiResponse<RevenueJobsResponse>>('/v2/admin/revenue/jobs', {
      params: cursor ? { cursor } : undefined,
    });
    return res.data.body;
  },

  listPendingPayments: async (): Promise<PendingPayment[]> => {
    const res = await apiClient.get<ApiResponse<PendingPayment[]>>('/v2/admin/payments');
    return res.data.body;
  },

  verifyPayment: async (paymentId: string): Promise<void> => {
    await apiClient.patch(`/v2/admin/payments/${paymentId}/verify`);
  },

  listWithdrawals: async (): Promise<WithdrawalItem[]> => {
    const res = await apiClient.get<ApiResponse<WithdrawalItem[]>>('/v2/admin/withdrawals');
    return res.data.body;
  },

  completeWithdrawal: async (id: string, data: CompleteWithdrawalPayload): Promise<WithdrawalItem> => {
    const res = await apiClient.patch<ApiResponse<WithdrawalItem>>(`/v2/admin/withdrawals/${id}/complete`, data);
    return res.data.body;
  },

  rejectWithdrawal: async (id: string, adminNote: string): Promise<WithdrawalItem> => {
    const res = await apiClient.patch<ApiResponse<WithdrawalItem>>(`/v2/admin/withdrawals/${id}/reject`, { admin_note: adminNote });
    return res.data.body;
  },

  getFinancialSummary: async (): Promise<FinancialSummary> => {
    const res = await apiClient.get<ApiResponse<FinancialSummary>>('/v2/admin/revenue/financial-summary');
    return res.data.body;
  },
};
