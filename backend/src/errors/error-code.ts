/**
 * ============================
 * System Error Code
 * ============================
 */
export enum ErrorCode {
  /* =========================
   * Authentication / Session
   * ========================= */
  AUTH_REQUIRED = 'AUTH_REQUIRED', // No token
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  SESSION_EXPIRED = 'SESSION_EXPIRED', // tokenVersion mismatch
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

  /* =========================
   * Authorization
   * ========================= */
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSION = 'INSUFFICIENT_PERMISSION',

  /* =========================
   * Identity
   * ========================= */
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  /* =========================
   * Validation
   * ========================= */
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  /* =========================
   * System
   * ========================= */
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

