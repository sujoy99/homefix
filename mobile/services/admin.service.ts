import { apiClient } from '@/api/client';

export type PendingProvider = {
  id: string;
  full_name: string;
  mobile: string;
  email: string | null;
  nid: string;
  status: string;
  created_at: string;
};

type ApiResponse<T> = { status: string; body: T };

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
};
