import { Request, Response, NextFunction } from 'express';
import { logger } from '@logger/logger';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;

    logger.info('HTTP request', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}
