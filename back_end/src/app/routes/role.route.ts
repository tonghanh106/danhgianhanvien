import { Router } from "express";
import { getRoles, getPermissions, updateRolePermissions } from "../controllers/role.controller";
import { authenticate, requirePermission } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/roles", authenticate, requirePermission('roles','view'), getRoles);
router.get("/permissions", authenticate, requirePermission('roles','view'), getPermissions);
router.post("/roles/:id/permissions", authenticate, requirePermission('roles','edit'), updateRolePermissions);

export default router;
