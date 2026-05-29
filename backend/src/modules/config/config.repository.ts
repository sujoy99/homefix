import { PlatformSetting } from './config.model';

export class ConfigRepository {
  static async getAll(): Promise<PlatformSetting[]> {
    return PlatformSetting.query();
  }

  static async get(key: string): Promise<PlatformSetting | undefined> {
    return PlatformSetting.query().findById(key);
  }

  static async set(key: string, value: string): Promise<void> {
    await PlatformSetting.query()
      .patch({ value })
      .where('key', key);
  }
}
