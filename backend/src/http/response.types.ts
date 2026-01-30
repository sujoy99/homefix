import { ErrorCode } from '@errors/error-code';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  http_code: number;
  error_code?: ErrorCode;
  message: string;
  body: T | null;
  errors?: ReadonlyArray<FieldError>;
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
