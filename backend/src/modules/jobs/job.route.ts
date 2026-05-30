import { Router } from 'express';
import multer from 'multer';
import { JobController } from './job.controller';
import { validate } from '@middlewares/validate';
import { createJobSchema, jobIdSchema, jobFeedSchema } from './job.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { roleGuard } from '@modules/auth/role.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';
import { UserRole } from '@modules/users/user.types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

export const jobRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: Jobs
 *     description: Job/booking lifecycle management
 */

/**
 * @openapi
 * /jobs:
 *   post:
 *     summary: Resident creates a new job (REQ-015)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id, description, service_address]
 *             properties:
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *                 minLength: 10
 *               service_address:
 *                 type: object
 *                 required: [house, road, area]
 *                 properties:
 *                   house: { type: string }
 *                   flat:  { type: string }
 *                   road:  { type: string }
 *                   area:  { type: string }
 *               title:            { type: string }
 *               media_urls:       { type: array, items: { type: string } }
 *               service_lat:      { type: number }
 *               service_lon:      { type: number }
 *               estimated_budget: { type: number }
 *               square_footage:   { type: number }
 *     responses:
 *       201:
 *         description: Job created
 *       400:
 *         description: Validation error or square footage required
 *       403:
 *         description: Forbidden
 */
jobRouter.post(
  '/',
  authGuard,
  roleGuard(UserRole.RESIDENT),
  validate(createJobSchema),
  asyncHandler(asAuthenticated(JobController.createJob))
);

/**
 * @openapi
 * /jobs:
 *   get:
 *     summary: Resident fetches their own jobs
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jobs list returned
 */
jobRouter.get(
  '/',
  authGuard,
  roleGuard(UserRole.RESIDENT),
  asyncHandler(asAuthenticated(JobController.getMyJobs))
);

/**
 * @openapi
 * /jobs/assigned:
 *   get:
 *     summary: Provider fetches their active and awaiting-payment jobs
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assigned jobs returned
 */
jobRouter.get(
  '/assigned',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  asyncHandler(asAuthenticated(JobController.getMyAssignedJobs))
);

/**
 * @openapi
 * /jobs/feed:
 *   get:
 *     summary: Provider fetches available jobs matching their skills (REQ-015)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job feed returned
 */
jobRouter.get(
  '/feed',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  validate(jobFeedSchema),
  asyncHandler(asAuthenticated(JobController.getProviderFeed))
);

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     summary: Get job detail by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Job returned
 *       404:
 *         description: Job not found
 */
jobRouter.get(
  '/:id',
  authGuard,
  validate(jobIdSchema),
  asyncHandler(asAuthenticated(JobController.getById))
);

/**
 * @openapi
 * /jobs/{id}/media:
 *   post:
 *     summary: Upload media files (photos/videos) for a job (REQ-010)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Media uploaded and job updated
 *       400:
 *         description: No files, too many files, or wrong type
 *       403:
 *         description: Not the job owner
 */
jobRouter.post(
  '/:id/media',
  authGuard,
  roleGuard(UserRole.RESIDENT),
  validate(jobIdSchema),
  upload.array('files', 10),
  asyncHandler(asAuthenticated(JobController.addJobMedia))
);

/**
 * @openapi
 * /jobs/{id}/voice-note:
 *   patch:
 *     summary: Upload a voice note for a job (REQ-011, Sprint 4)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Voice note saved
 *       403:
 *         description: Not the job owner
 */
jobRouter.patch(
  '/:id/voice-note',
  authGuard,
  roleGuard(UserRole.RESIDENT),
  validate(jobIdSchema),
  upload.single('file'),
  asyncHandler(asAuthenticated(JobController.setVoiceNote))
);

/**
 * @openapi
 * /jobs/{id}/accept:
 *   patch:
 *     summary: Provider accepts a pending job → ACTIVE (REQ-016)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Job accepted
 *       400:
 *         description: Invalid state transition
 *       403:
 *         description: Provider not eligible
 *       404:
 *         description: Job not found
 */
jobRouter.patch(
  '/:id/accept',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  validate(jobIdSchema),
  asyncHandler(asAuthenticated(JobController.acceptJob))
);

/**
 * @openapi
 * /jobs/{id}/complete:
 *   patch:
 *     summary: Provider marks work done → AWAITING_PAYMENT (REQ-017)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Job marked complete
 *       400:
 *         description: Invalid state transition
 *       403:
 *         description: Not the assigned provider
 *       404:
 *         description: Job not found
 */
jobRouter.patch(
  '/:id/complete',
  authGuard,
  roleGuard(UserRole.PROVIDER),
  validate(jobIdSchema),
  asyncHandler(asAuthenticated(JobController.completeJob))
);
