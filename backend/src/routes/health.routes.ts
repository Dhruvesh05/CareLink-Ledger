import { Router } from "express";
import { HealthController } from "../controllers/HealthController";

const router = Router();
const controller = new HealthController();

router.get("/", controller.liveness.bind(controller));
router.get("/ready", controller.readiness.bind(controller));

export default router;
