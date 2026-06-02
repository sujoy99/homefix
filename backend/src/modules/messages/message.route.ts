import { Router } from 'express';
import { MessageController } from './message.controller';
import { validate } from '@middlewares/validate';
import { sendMessageSchema, listMessagesSchema } from './message.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';

export const messageRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: Messages
 *     description: In-app job messaging between resident and provider
 */

/**
 * @openapi
 * /jobs/{id}/messages:
 *   post:
 *     summary: Send a message in a job thread (HF-100)
 *     description: Both the resident and the assigned provider can send messages. Job must be ACTIVE.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               type:
 *                 type: string
 *                 enum: [text, image]
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Job is not ACTIVE
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Caller is not a job participant
 *       404:
 *         description: Job not found
 */
messageRouter.post(
  '/jobs/:id/messages',
  authGuard,
  validate(sendMessageSchema),
  asyncHandler(asAuthenticated(MessageController.send))
);

/**
 * @openapi
 * /jobs/{id}/messages:
 *   get:
 *     summary: List messages in a job thread (HF-100, cursor-paginated)
 *     description: Both the resident and the assigned provider can read messages. Job must be ACTIVE.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Job ID
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: before
 *         schema: { type: string, format: uuid }
 *         description: Message UUID cursor — returns messages older than this one
 *     responses:
 *       200:
 *         description: Message list with optional next_cursor
 *       400:
 *         description: Job is not ACTIVE
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Caller is not a job participant
 *       404:
 *         description: Job not found
 */
messageRouter.get(
  '/jobs/:id/messages',
  authGuard,
  validate(listMessagesSchema),
  asyncHandler(asAuthenticated(MessageController.list))
);
