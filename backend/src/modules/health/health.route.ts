import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();

export const healthRouter = router;

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check service availability
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 http_code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 body:
 *                   type: object
 */
router.get('/', HealthController.check);

