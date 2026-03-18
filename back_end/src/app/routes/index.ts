import { Router } from "express";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import branchRoutes from "./branch.route";
import departmentRoutes from "./department.route";
import reasonRoutes from "./reason.route";
import employeeRoutes from "./employee.route";
import evaluationRoutes from "./evaluation.route";
import reportRoutes from "./report.route";
import roleRoutes from "./role.route";

const router = Router();

router.use("/", authRoutes);
router.use("/users", userRoutes);
router.use("/branches", branchRoutes);
router.use("/departments", departmentRoutes);
router.use("/reasons", reasonRoutes);
router.use("/employees", employeeRoutes);
router.use("/evaluations", evaluationRoutes);
router.use("/", reportRoutes);
router.use("/", roleRoutes);

export default router;
