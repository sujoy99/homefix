import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { IStorageProvider, SaveFileResult } from '../storage.interface';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export class LocalStorageProvider implements IStorageProvider {
  constructor(private uploadDir = UPLOAD_DIR) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(buffer: Buffer, originalName: string, mimeType: string): Promise<SaveFileResult> {
    const ext = path.extname(originalName) || this.extFromMime(mimeType);
    const key = `${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, key);

    await fs.promises.writeFile(filePath, buffer);

    return { key, url: `/uploads/${key}` };
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.promises.unlink(filePath);
    } catch {
      // File already gone — treat as success
    }
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'audio/mpeg': '.mp3',
      'audio/webm': '.webm',
      'video/mp4': '.mp4',
    };
    return map[mime] ?? '';
  }
}
