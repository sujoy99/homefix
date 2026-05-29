import { Request, Response } from 'express';
import { HttpResponse } from '@http/response';
import { ConfigService } from './config.service';

export class ConfigController {
  static async getPublic(req: Request, res: Response): Promise<void> {
    const settings = await ConfigService.getPublicSettings();
    HttpResponse.success(res, settings, 'Platform config');
  }
}
