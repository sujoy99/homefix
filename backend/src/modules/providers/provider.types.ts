export type ProviderProfile = {
  id: string;
  user_id: string;
  bio: string | null;
  experience_years: number;
  hourly_rate: number | string | null;
  is_available: boolean;
  rating_avg: string;
  total_reviews: number;
  created_at: string;
  updated_at: string;
};

export type ProviderSkill = {
  id: string;
  provider_id: string;
  category_id: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type ProviderProfileWithSkills = ProviderProfile & {
  skills: ProviderSkill[];
};

export type CreateProviderProfileInput = {
  user_id: string;
  bio?: string | null;
  experience_years?: number;
  hourly_rate?: number | null;
  is_available?: boolean;
};

export type UpdateProviderProfileInput = {
  bio?: string | null;
  experience_years?: number;
  hourly_rate?: number | null;
  is_available?: boolean;
  photo_url?: string | null;
  latitude?: number;
  longitude?: number;
};

export type AddSkillInput = {
  category_id: string;
  is_primary?: boolean;
};
