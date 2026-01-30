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
  REFRESH_TOKEN_REVOKED = 'REFRESH_TOKEN_REVOKED',

  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

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

