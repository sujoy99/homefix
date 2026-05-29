import { ConfigRepository } from './config.repository';
import { PlatformSettingKey } from '@homefix/shared';

export class ConfigService {
  static async getPublicSettings(): Promise<Record<string, string>> {
    const rows = await ConfigRepository.getAll();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  static async getSetting(key: PlatformSettingKey): Promise<string | null> {
    const row = await ConfigRepository.get(key);
    return row?.value ?? null;
  }

  static async updateSetting(key: PlatformSettingKey, value: string): Promise<void> {
    await ConfigRepository.set(key, value);
  }
}
