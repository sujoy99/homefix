export type CreateCategoryDTO = {
  name: string;
  name_bn?: string | null;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  requires_area?: boolean;
  sort_order?: number;
};

export type UpdateCategoryDTO = {
  name?: string;
  name_bn?: string | null;
  slug?: string;
  description?: string | null;
  icon_url?: string | null;
  requires_area?: boolean;
  is_active?: boolean;
  sort_order?: number;
};
