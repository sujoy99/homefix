import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { validate } from '@middlewares/validate';
import { registerDeviceTokenSchema, listNotificationsSchema, markReadSchema } from './notification.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';

const router = Router();

/**
 * @swagger
 * /users/me/device-token:
 *   post:
 *     summary: Register FCM device token
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/users/me/device-token',
  authGuard,
  validate(registerDeviceTokenSchema),
  asyncHandler(asAuthenticated(NotificationController.registerToken)),
);

/**
 * @swagger
 * /users/me/device-token:
 *   delete:
 *     summary: Unregister FCM device token
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 */
router.delete(
  '/users/me/device-token',
  authGuard,
  validate(registerDeviceTokenSchema),
  asyncHandler(asAuthenticated(NotificationController.unregisterToken)),
);

/**
 * @swagger
 * /users/me/notifications:
 *   get:
 *     summary: List notifications (paginated)
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/users/me/notifications',
  authGuard,
  validate(listNotificationsSchema),
  asyncHandler(asAuthenticated(NotificationController.listNotifications)),
);

/**
 * @swagger
 * /users/me/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 */
router.patch(
  '/users/me/notifications/:id/read',
  authGuard,
  validate(markReadSchema),
  asyncHandler(asAuthenticated(NotificationController.markRead)),
);

export { router as notificationRouter };
