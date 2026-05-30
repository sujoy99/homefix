import { Router } from 'express';
import { authRouterV2 } from '@modules/auth/v2/auth.route.v2';
import { categoryRouter } from '@modules/categories/category.route';
import { rbacRouter } from '@modules/auth/rbac.route';
import { providerRouter } from '@modules/providers/provider.route';
import { adminProviderRouter } from '@modules/admin/providers/admin-providers.route';
import { storageRouter } from '@modules/storage/storage.route';
import { configRouter } from '@modules/config/config.route';
import { jobRouter } from '@modules/jobs/job.route';
import { paymentRouter } from '@modules/payments/payment.route';
import { adminPaymentRouter } from '@modules/payments/admin-payment.route';
import { adminCommissionRouter } from '@modules/payments/commission/commission.route';
import { walletRouter } from '@modules/payments/wallet/wallet.route';
import { adminWithdrawalRouter } from '@modules/payments/wallet/admin-withdrawal.route';

const router = Router();

router.use('/auth', authRouterV2);
router.use('/categories', categoryRouter);
router.use('/admin/rbac', rbacRouter);
router.use('/admin/providers', adminProviderRouter);
router.use('/admin/payments', adminPaymentRouter);
router.use('/admin/commission', adminCommissionRouter);
router.use('/admin/withdrawals', adminWithdrawalRouter);
router.use('/providers', walletRouter);
router.use('/providers', providerRouter);
router.use('/storage', storageRouter);
router.use('/config', configRouter);
router.use('/jobs', jobRouter);
router.use('/payments', paymentRouter);

export default router;