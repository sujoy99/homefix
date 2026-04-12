import { Router } from 'express';
import { authRouter } from '@modules/auth/auth.route';
import { userRouter } from '@modules/users/user.route';
import { adminRouter } from '@modules/admin/admin.route';
import { healthRouter } from '@modules/health/health.route';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);

export default router;
