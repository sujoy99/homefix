import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error';
import { logger } from '@logger/logger';
import { HttpResponse } from '@http/response';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const requestId = req.id;

  /** Operational / expected errors */
  if (err instanceof AppError) {
    logger.warn('Operational error', {
      requestId,
      statusCode: err.statusCode,
      message: err.message,
      path: req.originalUrl,
      method: req.method,
    });

    return HttpResponse.error(
      res,
      err.message,
      err.statusCode
    );
  }

  /** Unknown / programmer errors */
  logger.error('Unhandled exception', {
    requestId,
    path: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  return HttpResponse.error(
    res,
    'Internal server error',
    500
  );
};
