/**
 * Platform Settings — keys and their valid values.
 *
 * These are stored in the `platform_settings` DB table (key/value rows).
 * Admins can update the `value` column directly (or via the admin API in Sprint 6).
 * Mobile and backend both import from here so valid values are always in sync.
 */

// ─── Keys ─────────────────────────────────────────────────────────────────────

export const PlatformSettingKey = {
  /** Source allowed for NID photo uploads during provider registration. */
  NID_PHOTO_SOURCE: 'nid_photo_source',

  /** Default platform commission % deducted from provider earnings. */
  PLATFORM_COMMISSION_PCT: 'platform_commission_pct',

  /** Active payment gateway: 'manual' (Phase 1) | 'sslcommerz' (Phase 2). */
  ACTIVE_PAYMENT_GATEWAY: 'active_payment_gateway',

  /** HomeFix bKash merchant number shown to Residents during payment. */
  BKASH_MERCHANT_NUMBER: 'bkash_merchant_number',

  /** HomeFix Nagad merchant number shown to Residents during payment. */
  NAGAD_MERCHANT_NUMBER: 'nagad_merchant_number',
} as const;

export type PlatformSettingKey = (typeof PlatformSettingKey)[keyof typeof PlatformSettingKey];

// ─── Valid values per key ────────────────────────────────────────────────────

/**
 * nid_photo_source valid values:
 *   camera_only        → provider MUST use camera (default — ensures photo authenticity)
 *   camera_and_gallery → provider may also pick from their photo library
 */
export const NidPhotoSource = {
  CAMERA_ONLY: 'camera_only',
  CAMERA_AND_GALLERY: 'camera_and_gallery',
} as const;

export type NidPhotoSource = (typeof NidPhotoSource)[keyof typeof NidPhotoSource];
