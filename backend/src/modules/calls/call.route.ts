import { Router } from 'express';
import { CallController } from './call.controller';
import { validate } from '@middlewares/validate';
import { createRoomSchema } from './call.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';

export const callRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: Calls
 *     description: In-app VoIP call room management
 */

/**
 * @openapi
 * /jobs/{id}/call/room:
 *   post:
 *     summary: Create a call room for an active job (HF-101)
 *     description: |
 *       Returns a RoomConfig the mobile client uses to join the call.
 *       Both the resident and the assigned provider can call this endpoint.
 *       The job must be ACTIVE. Room name is deterministic (homefix-job-{id}),
 *       so calling twice returns the same room — idempotent and load-balancer safe.
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Job ID
 *     responses:
 *       201:
 *         description: Room config (provider, roomName, serverUrl, optional token)
 *       400:
 *         description: Job is not ACTIVE
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Caller is not a job participant
 *       404:
 *         description: Job not found
 */
callRouter.post(
  '/jobs/:id/call/room',
  authGuard,
  validate(createRoomSchema),
  asyncHandler(asAuthenticated(CallController.createRoom)),
);
