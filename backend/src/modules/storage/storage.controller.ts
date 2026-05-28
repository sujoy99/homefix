import { Request, Response } from 'express';
import { storageService } from './storage.service';
import { HttpResponse } from '@http/response';
import { BadRequestError } from '@errors/http-errors';
import { ErrorCode } from '@errors/error-code';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/webm',
  'video/mp4',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export class StorageController {
  static async upload(req: Request, res: Response) {
    const file = (req as Request & { file?: Express.Multer.File }).file;

    if (!file) {
      throw new BadRequestError(ErrorCode.VALIDATION_ERROR, 'No file uploaded');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestError(ErrorCode.VALIDATION_ERROR, `File type not allowed: ${file.mimetype}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestError(ErrorCode.VALIDATION_ERROR, 'File size exceeds 10 MB limit');
    }

    const result = await storageService.save(file.buffer, file.originalname, file.mimetype);

    return HttpResponse.success(res, result, 'File uploaded successfully', 201);
  }

  static async deleteFile(req: Request, res: Response) {
    const { key } = req.params as { key: string };
    await storageService.delete(key);
    return HttpResponse.success(res, null, 'File deleted');
  }
}
