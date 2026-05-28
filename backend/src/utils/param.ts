import { Request } from 'express';

/**
 * Safely read a route param as string.
 * Express 5's ParamsDictionary types params as string | string[],
 * but route params (/:id) are always a single string at runtime.
 */
export function param(req: Request, name: string): string {
  return req.params[name] as unknown as string;
}
