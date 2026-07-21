import { Router } from "express";
import { DoctorController } from "../controllers/DoctorController";

const router = Router();

const controller = new DoctorController();

router.post(
  "/register",
  controller.register.bind(controller)
);

router.get(
  "/:wallet",
  controller.getDoctor.bind(controller)
);

router.post(
    "/verify",
    controller.verifyDoctor.bind(controller)
);

export default router;