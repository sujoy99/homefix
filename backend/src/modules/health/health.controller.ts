import { Request, Response } from 'express';
import { HealthService } from './health.service';
import { HttpResponse } from '@http/response';
import { AppError } from '@errors/app-error';
import knex from '@config/db';

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

  static async checkDb(req: Request, res: Response) {
    try {
      /**
       * DEBUG: Log DB config (SAFE)
       */
      console.log('DB CONFIG DEBUG:', {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD ? '****' : undefined, // mask password
      });

      await knex.raw('SELECT 1');

      return res.status(200).json({
        success: true,
        message: 'Database connection is healthy',
      });

    } catch (error: any) {
      console.error('DB CONNECTION ERROR:', error);

      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
      });
    }
  }
}
