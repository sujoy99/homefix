/**
 * ============================
 * Auth & Error Types
 * ============================
 * Shared error codes and auth-related types.
 *
 * The ErrorCode enum drives frontend behavior:
 * - TOKEN_EXPIRED → call /auth/refresh
 * - SESSION_EXPIRED → force logout
 * - INVALID_CREDENTIALS → show error message
 * - INSUFFICIENT_PERMISSION → show 403 page
 *
 * Used in: backend (throw), mobile/web (handle)
 */

/**
 * System-wide error codes.
 *
 * Frontend action mapping:
 * | ErrorCode              | Frontend Action     |
 * |------------------------|---------------------|
 * | AUTH_REQUIRED          | Redirect to login   |
 * | TOKEN_EXPIRED          | Call /auth/refresh   |
 * | SESSION_EXPIRED        | Logout + redirect   |
 * | REFRESH_TOKEN_REVOKED  | Logout everywhere   |
 * | INVALID_CREDENTIALS    | Show error message  |
 * | ALREADY_EXISTS         | Show error message  |
 * | INSUFFICIENT_PERMISSION| Show 403 page       |
 * | RESOURCE_NOT_FOUND     | Show 404 page       |
 */
export enum ErrorCode {
  /* ─── Authentication / Session ─── */
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  SESSION_EXPIRED = 'SESSION_EXPIRED',
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_REVOKED = 'REFRESH_TOKEN_REVOKED',
  REFRESH_TOKEN_REUSED = 'REFRESH_TOKEN_REUSED',
  AUTH_ACCOUNT_NOT_FOUND = 'AUTH_ACCOUNT_NOT_FOUND',

  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_NOT_APPROVED = 'ACCOUNT_NOT_APPROVED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  AUTH_METHOD_NOT_AVAILABLE = 'AUTH_METHOD_NOT_AVAILABLE',
  PASSWORD_NOT_SET = 'PASSWORD_NOT_SET',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',

  /* ─── Authorization ─── */
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSION = 'INSUFFICIENT_PERMISSION',

  /* ─── Identity ─── */
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  /* ─── Validation ─── */
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  /* ─── System ─── */
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

/**
 * Error codes that should trigger a forced logout on the client.
 */
export const FORCE_LOGOUT_CODES: ReadonlySet<ErrorCode> = new Set([
  ErrorCode.SESSION_EXPIRED,
  ErrorCode.REFRESH_TOKEN_REVOKED,
  ErrorCode.REFRESH_TOKEN_REUSED,
]);

/**
 * Error codes that should trigger a token refresh attempt.
 */
export const TOKEN_REFRESH_CODES: ReadonlySet<ErrorCode> = new Set([
  ErrorCode.TOKEN_EXPIRED,
]);

/**
 * Standardized API response shape.
 * All backend responses follow this contract.
 */
export interface ApiResponse<T = unknown> {
  http_code: number;
  message: string;
  body: T;
  error_code?: ErrorCode;
  errors?: ReadonlyArray<FieldError>;
}

/**
 * Field-level validation error.
 */
export interface FieldError {
  field: string;
  messages: string[];
}

/**
 * Paginated response body shape.
 */
export interface PaginatedBody<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
