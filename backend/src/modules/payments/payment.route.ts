import { Router } from 'express';

/**
 * Payment routes — mounted at /api/v2/payments
 * Controllers added in HF-055 (manual gateway) and subsequent tickets.
 */
const router = Router();

export { router as paymentRouter };
