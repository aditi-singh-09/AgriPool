import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as pinoHttpModule from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// pino-http ships as CJS; Node's ESM/CJS interop exposes the real
// module.exports (the callable middleware factory) as `.default` on a
// namespace import. Its type declarations don't line up cleanly with
// NodeNext's default-import interop, so the callable is resolved at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinoHttp = (pinoHttpModule as any).default as (opts: { logger: typeof logger }) => express.RequestHandler;

import authRoutes from './routes/authRoutes.js';
import poolRoutes from './routes/poolRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', globalLimiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/pools', poolRoutes);
  app.use('/api/listings', listingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
