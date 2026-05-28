export type SaveFileResult = {
  url: string;
  key: string;
};

export interface IStorageProvider {
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<SaveFileResult>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}
