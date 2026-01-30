import 'express-serve-static-core';
import { UserRole } from '@modules/users/user.types';

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
    user?: {
      id: string;
      email: string;
      role: UserRole;
      tokenVersion: number
    };
  }
}