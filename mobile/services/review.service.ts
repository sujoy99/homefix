import { apiClient } from '@/api/client';

export type Review = {
  id: string;
  job_id: string;
  resident_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type ProviderReviewsResponse = {
  items: Review[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type ApiResponse<T> = { status: string; body: T };

export const reviewService = {
  submitReview: async (jobId: string, rating: number, comment?: string): Promise<Review> => {
    const res = await apiClient.post<ApiResponse<Review>>(`/v2/jobs/${jobId}/review`, {
      rating,
      ...(comment?.trim() ? { comment: comment.trim() } : {}),
    });
    return res.data.body;
  },

  getProviderReviews: async (
    providerId: string,
    page = 1,
    limit = 10,
  ): Promise<ProviderReviewsResponse> => {
    const res = await apiClient.get<ApiResponse<ProviderReviewsResponse>>(
      `/v2/providers/${providerId}/reviews`,
      { params: { page, limit } },
    );
    return res.data.body;
  },
};
