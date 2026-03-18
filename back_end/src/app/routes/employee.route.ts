import { Router } from "express";
import { getEmployees, createEmployee, importEmployees, updateEmployee, deleteEmployee } from "../controllers/employee.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Quản lý danh sách Nhân viên
 */

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Lấy danh sách nhân viên
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", authenticate, getEmployees);

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Tạo nhân viên mới
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee_code:
 *                 type: string
 *               full_name:
 *                 type: string
 *               department_id:
 *                 type: integer
 *               branch_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/", authenticate, createEmployee);

/**
 * @swagger
 * /employees/import:
 *   post:
 *     summary: Import danh sách nhân viên từ Excel
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import thành công
 */
router.post("/import", authenticate, importEmployees);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Cập nhật nhân viên
 *     tags: [Employees]
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
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put("/:id", authenticate, updateEmployee);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Xóa nhân viên
 *     tags: [Employees]
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
router.delete("/:id", authenticate, deleteEmployee);

export default router;
