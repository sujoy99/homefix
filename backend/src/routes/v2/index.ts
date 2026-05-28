import { Router } from 'express';
import { authRouterV2 } from '@modules/auth/v2/auth.route.v2';
import { categoryRouter } from '@modules/categories/category.route';
import { rbacRouter } from '@modules/auth/rbac.route';
import { providerRouter } from '@modules/providers/provider.route';
import { adminProviderRouter } from '@modules/admin/providers/admin-providers.route';
import { storageRouter } from '@modules/storage/storage.route';

const router = Router();

router.use('/auth', authRouterV2);
router.use('/categories', categoryRouter);
router.use('/admin/rbac', rbacRouter);
router.use('/admin/providers', adminProviderRouter);
router.use('/providers', providerRouter);
router.use('/storage', storageRouter);

export default router;