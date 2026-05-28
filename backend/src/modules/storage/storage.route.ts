import { Router } from 'express';
import multer from 'multer';
import { StorageController } from './storage.controller';
import { authGuard } from '@modules/auth/auth.guard';
import { permissionGuard } from '@modules/auth/rbac.guard';
import { Permission } from '@modules/auth/permissions';
import { asyncHandler } from '@utils/async-handler';

export const storageRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB — enforced again in controller
});

/**
 * @openapi
 * tags:
 *   - name: Storage
 *     description: File upload and management
 */

/**
 * @openapi
 * /storage/upload:
 *   post:
 *     summary: Upload a file (image, audio, video)
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 body:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: "a1b2c3d4-....jpg"
 *                     url:
 *                       type: string
 *                       example: "/uploads/a1b2c3d4-....jpg"
 *       400:
 *         description: No file, disallowed type, or file too large
 *       401:
 *         description: Unauthorized
 */
storageRouter.post(
  '/upload',
  authGuard,
  permissionGuard(Permission.FILE_UPLOAD),
  upload.single('file'),
  asyncHandler(StorageController.upload)
);

/**
 * @openapi
 * /storage/{key}:
 *   delete:
 *     summary: Delete a stored file by key
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted
 *       401:
 *         description: Unauthorized
 */
storageRouter.delete(
  '/:key',
  authGuard,
  permissionGuard(Permission.FILE_UPLOAD),
  asyncHandler(StorageController.deleteFile)
);
