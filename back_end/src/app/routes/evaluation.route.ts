import { Router } from "express";
import { getEvaluations, createEvaluation } from "../controllers/evaluation.controller";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Evaluations
 *   description: Đánh giá nhân viên hàng ngày
 */

/**
 * @swagger
 * /evaluations:
 *   get:
 *     summary: Lấy danh sách đánh giá theo ngày
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", authenticate, requirePermission('evaluations','view'), getEvaluations);

/**
 * @swagger
 * /evaluations:
 *   post:
 *     summary: Ghi nhận đánh giá nhân viên (Upsert)
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee_id:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               stars:
 *                 type: integer
 *               reason_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xử lý thành công
 */
router.post("/", authenticate, requirePermission('evaluations','create'), createEvaluation);

export default router;
