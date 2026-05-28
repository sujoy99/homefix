export type CreateProviderProfileDTO = {
  bio?: string | null;
  experience_years?: number;
  hourly_rate?: number | null;
  is_available?: boolean;
};

export type UpdateProviderProfileDTO = {
  bio?: string | null;
  experience_years?: number;
  hourly_rate?: number | null;
  is_available?: boolean;
};

export type AddSkillDTO = {
  category_id: string;
  is_primary?: boolean;
};
