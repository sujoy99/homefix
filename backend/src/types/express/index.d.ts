import 'express-serve-static-core';
import { UserRole, UserStatus } from '@modules/users/user.types';
import { JwtPayload } from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    /**
     * Unique request ID
     * - Injected by request-id middleware
     * - Used for logging & tracing
     */
    id: string;

    /**
     * Authenticated user context
     * - Injected by authGuard
     * - Undefined for public routes
     */
    user?: JwtPayload;

    /**
     * Client metadata (from middleware)
     */
    clientInfo?: {
      ip: string;
      userAgent?: string;
    };
  }
}