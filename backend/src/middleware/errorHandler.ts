import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';
import { Sentry } from '../config/sentry.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.originalUrl }, 'Unhandled application error');
      Sentry.captureException(err);
    } else {
      logger.warn({ code: err.code, path: req.originalUrl }, err.message);
    }
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error({ err, path: req.originalUrl }, 'Unexpected error');
  Sentry.captureException(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our end' },
  });
}
