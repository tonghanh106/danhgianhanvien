import { Router } from "express";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/user.controller";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Quản lý thông tin tài khoản nhân sự (RBAC)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách toàn bộ người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách user
 */
router.get("/", authenticate, requirePermission('users','view'), getUsers);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Tạo tài khoản người dùng mới
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - full_name
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               full_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 example: USER
 *               department_id:
 *                 type: integer
 *               branch_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Trả về ID user vừa tạo
 */
router.post("/", authenticate, requirePermission('users','create'), createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng cần sửa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               full_name:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 example: USER
 *               department_id:
 *                 type: integer
 *               branch_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", authenticate, requirePermission('users','edit'), updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Xóa tài khoản người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete("/:id", authenticate, requirePermission('users','delete'), deleteUser);

export default router;
