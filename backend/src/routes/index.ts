import { Router } from 'express';
import { authRouter } from '@modules/auth/auth.route';
import { userRouter } from '@modules/users/user.route';
import { adminRouter } from '@modules/admin/admin.route';
import { healthRouter } from '@modules/health/health.route';

export function registerRoutes(app: Router) {
  app.use('/health', healthRouter);
  app.use('/auth', authRouter); // Public
  app.use('/users', userRouter); // Protected user routes (Auth Only)
  app.use('/admin', adminRouter); // Auth + Role protected
}
