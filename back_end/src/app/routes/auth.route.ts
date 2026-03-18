import { Router } from "express";
import { login, logout, checkAuth, changePassword } from "../controllers/auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Các API quản lý đăng nhập, đăng xuất và phiên làm việc
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về token và thông tin user
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu
 *       403:
 *         description: Tài khoản đang đăng nhập ở nơi khác
 */
router.post("/login", login);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post("/logout", authenticate, logout);

/**
 * @swagger
 * /auth/check:
 *   get:
 *     summary: Kiểm tra token còn hợp lệ không (Session Heartbeat)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token hợp lệ
 *       401:
 *         description: Token hết hạn hoặc không hợp lệ
 */
router.get("/auth/check", authenticate, checkAuth);

/**
 * @swagger
 * /change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ sai hoặc mật khẩu mới chưa đủ mạnh
 */
router.post("/change-password", authenticate, changePassword);

export default router;
