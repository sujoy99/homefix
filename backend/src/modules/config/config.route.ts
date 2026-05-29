import { Router } from 'express';
import { asyncHandler } from '@utils/async-handler';
import { ConfigController } from './config.controller';

const router = Router();

/**
 * @openapi
 * /v2/config/public:
 *   get:
 *     summary: Get public platform settings
 *     description: Returns all platform configuration values readable by the mobile app (no auth required).
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Key-value map of platform settings
 */
router.get('/public', asyncHandler(ConfigController.getPublic));

export { router as configRouter };
