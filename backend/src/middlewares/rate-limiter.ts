import rateLimit from 'express-rate-limit';
import { env } from '@config/env';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    http_code: 429,
    message: 'Too many requests, please try again later',
    body: null,
  },
});

/**
 * Tight limiter for auth endpoints (login + register).
 * Limits credential-stuffing and brute-force at the network edge.
 * Production: 10 req / 15 min per IP.
 * Development/test: 100 req / 15 min so manual testing is not blocked.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    http_code: 429,
    message: 'Too many auth attempts. Please try again later.',
    body: null,
  },
});
