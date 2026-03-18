import { Router } from "express";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../controllers/branch.controller";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Branches
 *   description: Quản lý danh sách Chi nhánh
 */

/**
 * @swagger
 * /branches:
 *   get:
 *     summary: Lấy danh sách chi nhánh
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", authenticate, requirePermission('branches','view'), getBranches);

/**
 * @swagger
 * /branches:
 *   post:
 *     summary: Tạo chi nhánh mới
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/", authenticate, requirePermission('branches','create'), createBranch);

/**
 * @swagger
 * /branches/{id}:
 *   put:
 *     summary: Cập nhật chi nhánh
 *     tags: [Branches]
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put("/:id", authenticate, requirePermission('branches','edit'), updateBranch);

/**
 * @swagger
 * /branches/{id}:
 *   delete:
 *     summary: Xóa chi nhánh
 *     tags: [Branches]
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
router.delete("/:id", authenticate, requirePermission('branches','delete'), deleteBranch);

export default router;
