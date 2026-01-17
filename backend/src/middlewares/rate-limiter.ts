import rateLimit from 'express-rate-limit';
import { env } from '@config/env';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    http_code: 429,
    message: 'Too many requests, please try again later',
    body: null,
  },
});
