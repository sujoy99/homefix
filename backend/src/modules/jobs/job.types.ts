import { JobStatus } from '@homefix/shared';

export { JobStatus };

export type ServiceAddress = {
  house: string;
  flat?: string;
  road: string;
  area: string;
};

export type Job = {
  id: string;
  resident_id: string;
  provider_id: string | null;
  category_id: string;
  status: JobStatus;
  title: string | null;
  description: string;
  voice_note_url: string | null;
  media_urls: string[];
  service_address: ServiceAddress;
  service_lat: number | null;
  service_lon: number | null;
  estimated_budget: number | string | null;
  square_footage: number | string | null;
  created_at: string;
  updated_at: string;
};

export type CreateJobInput = {
  resident_id: string;
  category_id: string;
  description: string;
  service_address: ServiceAddress;
  title?: string;
  voice_note_url?: string;
  media_urls?: string[];
  service_lat?: number;
  service_lon?: number;
  estimated_budget?: number;
  square_footage?: number;
};

export type JobFeedQuery = {
  limit?: number;
  cursor?: string;
  lat?: number;
  lon?: number;
};
