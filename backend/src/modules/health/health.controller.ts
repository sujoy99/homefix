import { Request, Response } from 'express';
import { HealthService } from './health.service';
import { HttpResponse } from '@http/response';
import { AppError } from '@errors/app-error';

export class HealthController {
  static async check(req: Request, res: Response) {
    const health = await HealthService.check();

    if (!health) {
        throw new AppError('Service is unhealthy', 503);
    }

    return HttpResponse.success(
      res,
      health,
      'Service is healthy'
    );
  }
}
