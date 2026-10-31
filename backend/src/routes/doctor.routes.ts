import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { DoctorController } from "../controllers/DoctorController";

const router = Router();

// All business routes require JWT authentication.
router.use(authenticate);

const controller = new DoctorController();

router.post(
    "/register",
    controller.registerDoctor.bind(controller)
);

router.get(
    "/total",
    controller.totalDoctors.bind(controller)
);

router.get(
    "/active/:wallet",
    controller.isDoctorActive.bind(controller)
);

router.get(
    "/verified/:wallet",
    controller.isDoctorVerified.bind(controller)
);

router.get(
    "/hospital/:wallet",
    controller.getDoctorHospital.bind(controller)
);

router.get(
    "/:wallet",
    controller.getDoctor.bind(controller)
);

router.post(
    "/verify",
    requireRole("Admin"),
    controller.verifyDoctor.bind(controller)
);

router.post(
    "/revoke-verification",
    requireRole("Admin"),
    controller.revokeVerification.bind(controller)
);

router.post(
    "/deactivate",
    requireRole("Doctor"),
    controller.deactivateDoctor.bind(controller)
);

router.post(
    "/reactivate",
    requireRole("Admin"),
    controller.reactivateDoctor.bind(controller)
);

router.post(
    "/update-specialization",
    requireRole("Doctor"),
    controller.updateSpecialization.bind(controller)
);

export default router;