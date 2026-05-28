import { IStorageProvider, SaveFileResult } from './storage.interface';
import { LocalStorageProvider } from './providers/local.storage';

/**
 * Pluggable file storage service.
 * Phase 1: local disk  (LocalStorageProvider)
 * Phase 2: AWS S3      (swap in S3StorageProvider — same interface)
 *
 * To swap providers, change the `provider` assignment in `resolveProvider()`.
 */
class StorageService {
  private provider: IStorageProvider;

  constructor() {
    this.provider = this.resolveProvider();
  }

  private resolveProvider(): IStorageProvider {
    // Future: if (env.storageProvider === 's3') return new S3StorageProvider();
    return new LocalStorageProvider();
  }

  async save(buffer: Buffer, originalName: string, mimeType: string): Promise<SaveFileResult> {
    return this.provider.save(buffer, originalName, mimeType);
  }

  getUrl(key: string): string {
    return this.provider.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }
}

export const storageService = new StorageService();
