import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

const controller = new AuthController();

router.get(
    "/status",
    controller.status.bind(controller)
);

router.post(
    "/challenge",
    controller.challenge.bind(controller)
);

router.post(
    "/verify",
    controller.verify.bind(controller)
);

export default router;
