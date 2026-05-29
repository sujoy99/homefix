import { apiClient } from '@/api/client';

export type Category = {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  icon_url: string | null;
  requires_area: boolean;
  is_active: boolean;
  sort_order: number;
};

type ApiResponse<T> = { status: string; body: T };

export const categoryService = {
  listActive: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/v2/categories');
    return res.data.body;
  },
};
