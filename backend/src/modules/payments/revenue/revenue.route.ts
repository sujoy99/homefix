import { Router } from 'express';
import { RevenueController } from './revenue.controller';
import { validate } from '@middlewares/validate';
import { revenueDashboardSchema, revenueJobsSchema } from './revenue.schema';
import { authGuard } from '@modules/auth/auth.guard';
import { roleGuard } from '@modules/auth/role.guard';
import { asAuthenticated } from '@modules/auth/auth.adapter';
import { asyncHandler } from '@utils/async-handler';
import { UserRole } from '@modules/users/user.types';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Admin - Revenue
 *     description: Admin revenue dashboard and per-job commission detail (REQ-023)
 */

/**
 * @openapi
 * /admin/revenue:
 *   get:
 *     summary: Revenue dashboard — aggregated totals, period breakdown, rule breakdown, top categories
 *     tags: [Admin - Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, monthly]
 *           default: monthly
 *         description: Aggregation granularity for revenue_by_period
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter ledger entries on or after this timestamp (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter ledger entries on or before this timestamp (ISO 8601)
 *     responses:
 *       200:
 *         description: Revenue dashboard aggregates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_revenue_paisa:
 *                   type: integer
 *                   description: Sum of all platform fees in paisa (all time, or filtered range)
 *                 revenue_by_period:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date: { type: string }
 *                       total_paisa: { type: integer }
 *                 breakdown_by_rule:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rule_id: { type: string, format: uuid }
 *                       label: { type: string }
 *                       scope: { type: string }
 *                       rate: { type: string }
 *                       total_paisa: { type: integer }
 *                 top_categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       slug: { type: string }
 *                       total_paisa: { type: integer }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get(
  '/',
  authGuard,
  roleGuard(UserRole.ADMIN),
  validate(revenueDashboardSchema),
  asyncHandler(asAuthenticated(RevenueController.getDashboard))
);

/**
 * @openapi
 * /admin/revenue/jobs:
 *   get:
 *     summary: Per-job commission detail — cursor-paginated
 *     tags: [Admin - Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: ISO timestamp cursor from previous page's nextCursor
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated per-job revenue rows
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ledger_id: { type: string, format: uuid }
 *                       payment_id: { type: string, format: uuid }
 *                       job_id: { type: string, format: uuid }
 *                       revenue_paisa: { type: integer }
 *                       payment_amount_paisa: { type: integer }
 *                       commission_rate: { type: string }
 *                       method: { type: string }
 *                       rule_label: { type: string }
 *                       rule_scope: { type: string }
 *                       category_name: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                       verified_at: { type: string, format: date-time, nullable: true }
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: Pass as cursor param to fetch the next page; null on last page
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get(
  '/jobs',
  authGuard,
  roleGuard(UserRole.ADMIN),
  validate(revenueJobsSchema),
  asyncHandler(asAuthenticated(RevenueController.getJobsDetail))
);

export { router as adminRevenueRouter };
