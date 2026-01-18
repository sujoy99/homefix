import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.types';

/**
 * Adapter to allow AuthenticatedRequest handlers
 * to work with Express Router
 */
export const asAuthenticated =
  (handler: (req: AuthenticatedRequest, res: Response) => Promise<Response>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthenticatedRequest, res).catch(next);
  };
