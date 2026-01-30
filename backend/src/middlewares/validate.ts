import { z, ZodError } from 'zod';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '@errors/app-error';
import { ErrorCode } from '@errors/error-code';

/**
 * Generic Zod validation middleware
 * - Zod v4 compatible
 * - Works with body / query / params
 */
export const validate =
  (schema: z.ZodType<unknown>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    }catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path
            .filter((p) => typeof p === 'string')
            .slice(1) // remove "body"
            .join('.'),
          message: issue.message,
        }));

        const groupedErrors = Object.values(
          errors.reduce(
            (acc, err) => {
              acc[err.field] ??= { field: err.field, messages: [] };
              acc[err.field].messages.push(err.message);
              return acc;
            },
            {} as Record<string, any>
          )
        );
        return next(new AppError('Validation failed', 400, ErrorCode.VALIDATION_ERROR, groupedErrors));
      }

      next(error);
    }
  };
