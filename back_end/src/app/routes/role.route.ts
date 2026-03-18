import { Router } from "express";
import { getRoles, getPermissions, updateRolePermissions } from "../controllers/role.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/roles", authenticate, getRoles);
router.get("/permissions", authenticate, getPermissions);
router.post("/roles/:id/permissions", authenticate, updateRolePermissions);

export default router;
