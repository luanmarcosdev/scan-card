import express from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();
const controller = new AnalyticsController();

router.use('/analytics', authMiddleware);

/**
 * @openapi
 * /api/analytics:
 *   get:
 *     summary: Get expense analytics for the authenticated user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: card_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by card
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month (requires year)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2000
 *         description: Filter by year
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by expense category
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/AnalyticsResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/analytics', controller.getAnalytics.bind(controller));

/**
 * @openapi
 * /api/analytics/transactions:
 *   get:
 *     summary: Get transactions for analytics detail view
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: card_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by card
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month (requires year)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2000
 *         description: Filter by year
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by expense category
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [cash, installments, ends_this_month, ends_next_month, ends_within_3_months]
 *         description: Filter by purchase type
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PurchaseTransaction'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/analytics/transactions', controller.getTransactions.bind(controller));

export default router;
