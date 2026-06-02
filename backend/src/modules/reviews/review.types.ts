export interface Review {
  id: string;
  job_id: string;
  resident_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  resident?: { full_name: string };
}

export interface ReviewListItem {
  id: string;
  job_id: string;
  resident_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  resident_name: string;
}
