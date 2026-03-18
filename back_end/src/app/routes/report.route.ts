import { Router } from "express";
import { getSummary, getSummaryDepartments, getDepartmentDetails, getEmployeeDetails, getDashboardOverview } from "../controllers/report.controller";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports & Dashboards
 *   description: Các API kết xuất báo cáo và tổng quan thống kê
 */

/**
 * @swagger
 * /summary:
 *   get:
 *     summary: Lấy báo cáo tổng hợp sao nhân viên theo khoảng thời gian
 *     tags: [Reports & Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/summary", authenticate, requirePermission('reports','view'), getSummary);

/**
 * @swagger
 * /summary/departments:
 *   get:
 *     summary: Lấy báo cáo tổng hợp sao theo bộ phận
 *     tags: [Reports & Dashboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/summary/departments", authenticate, requirePermission('reports','view'), getSummaryDepartments);

/**
 * @swagger
 * /reports/department/{id}:
 *   get:
 *     summary: Báo cáo chi tiết của một bộ phận
 *     tags: [Reports & Dashboards]
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
router.get("/reports/department/:id", authenticate, requirePermission('reports','view'), getDepartmentDetails);

/**
 * @swagger
 * /reports/employee/{id}:
 *   get:
 *     summary: Báo cáo chi tiết đánh giá của một nhân viên
 *     tags: [Reports & Dashboards]
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
router.get("/reports/employee/:id", authenticate, requirePermission('reports','view'), getEmployeeDetails);

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Lấy các con số tổng quan Dashboard
 *     tags: [Reports & Dashboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về Total Branches, Departments, Users, v.v
 */
router.get("/dashboard/overview", authenticate, requirePermission('reports','view'), getDashboardOverview);

export default router;
