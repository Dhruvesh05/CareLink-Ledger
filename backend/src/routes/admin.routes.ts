import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { AdminController } from "../controllers/AdminController";

const router = Router();
router.use(authenticate, requireRole("Admin"));
const controller = new AdminController();

router.get("/stats", controller.stats.bind(controller));
router.get("/users", controller.users.bind(controller));
router.patch("/users/:userId/status", controller.setStatus.bind(controller));
router.get("/audit", controller.audit.bind(controller));
router.get("/audit/stats", controller.auditStats.bind(controller));
router.get("/cross-chain", controller.crossChain.bind(controller));
router.get("/reports", controller.reports.bind(controller));
router.get("/monitoring", controller.monitoring.bind(controller));
router.get("/ipfs/:cid", controller.ipfsCid.bind(controller));

export default router;
