import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError.js';

/**
 * Validates `req.body` / `req.query` / `req.params` against a Zod schema
 * shaped as `{ body?, query?, params? }`, then overwrites those keys on
 * `req` with the parsed (and coerced) values so downstream handlers can
 * trust their types.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
      next(AppError.badRequest('Validation failed', result.error.flatten()));
      return;
    }
    const parsed = result.data as { body?: unknown; query?: unknown; params?: unknown };
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) req.query = parsed.query as typeof req.query;
    if (parsed.params !== undefined) req.params = parsed.params as typeof req.params;
    next();
  };
}
