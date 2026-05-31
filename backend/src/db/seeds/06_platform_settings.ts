import { Knex } from 'knex';
import { PlatformSettingKey, NidPhotoSource, ProfilePhotoSource } from '@homefix/shared';

/**
 * Platform Settings seed.
 *
 * To change a setting: update the `value` field below and re-run the seed,
 * OR update the row directly in the DB:
 *   UPDATE platform_settings SET value = 'camera_and_gallery' WHERE key = 'nid_photo_source';
 *
 * Valid values per key:
 *   nid_photo_source:
 *     'camera_only'         → provider must use camera during registration (default)
 *     'camera_and_gallery'  → provider may also pick from their photo library
 *
 *   platform_commission_pct:
 *     any numeric string, e.g. '20' for 20%
 */
export async function seed(knex: Knex): Promise<void> {
  await knex('platform_settings').del();

  await knex('platform_settings').insert([
    {
      key: PlatformSettingKey.NID_PHOTO_SOURCE,
      value: NidPhotoSource.CAMERA_ONLY,
      description: `NID photo source during provider registration. Valid: '${NidPhotoSource.CAMERA_ONLY}' | '${NidPhotoSource.CAMERA_AND_GALLERY}'`,
    },
    {
      key: PlatformSettingKey.PROFILE_PHOTO_SOURCE,
      value: ProfilePhotoSource.CAMERA_ONLY,
      description: `Profile photo source during provider profile edit. Valid: '${ProfilePhotoSource.CAMERA_ONLY}' | '${ProfilePhotoSource.CAMERA_AND_GALLERY}'`,
    },
    {
      key: PlatformSettingKey.PLATFORM_COMMISSION_PCT,
      value: '20',
      description: 'Default platform commission % deducted from provider earnings. e.g. 20 = 20%',
    },
    {
      key: PlatformSettingKey.ACTIVE_PAYMENT_GATEWAY,
      value: 'manual',
      description: "Active payment gateway. Valid: 'manual' (Phase 1 — bKash/Nagad TxID) | 'sslcommerz' (Phase 2)",
    },
    {
      key: PlatformSettingKey.BKASH_MERCHANT_NUMBER,
      value: '01700000000',
      description: 'HomeFix bKash merchant number displayed to Residents during payment. Update with real number before go-live.',
    },
    {
      key: PlatformSettingKey.NAGAD_MERCHANT_NUMBER,
      value: '01700000001',
      description: 'HomeFix Nagad merchant number displayed to Residents during payment. Update with real number before go-live.',
    },
  ]);
}
