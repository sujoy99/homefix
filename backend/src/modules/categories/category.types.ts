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
  created_at: string;
  updated_at: string;
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  requires_area?: boolean;
  sort_order?: number;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput> & {
  is_active?: boolean;
};
