import { Router } from "express";
import { getReasons, createReason, updateReason, deleteReason } from "../controllers/reason.controller";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reasons (Star Criteria)
 *   description: Quản lý tiêu chí / lý do đánh giá sao
 */

/**
 * @swagger
 * /reasons:
 *   get:
 *     summary: Lấy danh sách tiêu chí đánh giá
 *     tags: [Reasons (Star Criteria)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", authenticate, requirePermission('reasons','view'), getReasons);

/**
 * @swagger
 * /reasons:
 *   post:
 *     summary: Tạo tiêu chí mới
 *     tags: [Reasons (Star Criteria)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stars:
 *                 type: integer
 *               reason_text:
 *                 type: string
 *               department_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/", authenticate, requirePermission('reasons','create'), createReason);

/**
 * @swagger
 * /reasons/{id}:
 *   put:
 *     summary: Cập nhật tiêu chí
 *     tags: [Reasons (Star Criteria)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stars:
 *                 type: integer
 *               reason_text:
 *                 type: string
 *               department_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put("/:id", authenticate, requirePermission('reasons','edit'), updateReason);

/**
 * @swagger
 * /reasons/{id}:
 *   delete:
 *     summary: Xóa tiêu chí
 *     tags: [Reasons (Star Criteria)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.delete("/:id", authenticate, requirePermission('reasons','delete'), deleteReason);

export default router;
