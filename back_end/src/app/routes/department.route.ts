import { Router } from "express";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../controllers/department.controller";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Quản lý danh sách Bộ phận / Phòng ban
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Lấy danh sách bộ phận
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", authenticate, requirePermission('departments','view'), getDepartments);

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Tạo bộ phận mới
 *     tags: [Departments]
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
 *               branch_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/", authenticate, requirePermission('departments','create'), createDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: Cập nhật bộ phận
 *     tags: [Departments]
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
 *               branch_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put("/:id", authenticate, requirePermission('departments','edit'), updateDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Xóa bộ phận
 *     tags: [Departments]
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
router.delete("/:id", authenticate, requirePermission('departments','delete'), deleteDepartment);

export default router;
