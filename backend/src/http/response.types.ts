export interface ApiResponse<T = unknown> {
  http_code: number;
  message: string;
  body: T | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedBody<T> {
  items: T[];
  pagination: PaginationMeta;
}
