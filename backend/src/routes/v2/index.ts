import { Router } from 'express';
import { authRouterV2 } from '@modules/auth/v2/auth.route.v2';

const router = Router();

router.use('/auth', authRouterV2);

export default router;