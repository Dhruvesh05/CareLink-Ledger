import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

const controller = new AuthController();

router.get("/status", controller.status.bind(controller));

export default router;