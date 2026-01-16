import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestId(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  req.id = randomUUID();
  next();
}
