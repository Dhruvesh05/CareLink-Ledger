import { Router } from "express";
import { DoctorController } from "../controllers/DoctorController";

const router = Router();

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
    controller.verifyDoctor.bind(controller)
);

router.post(
    "/revoke-verification",
    controller.revokeVerification.bind(controller)
);

router.post(
    "/deactivate",
    controller.deactivateDoctor.bind(controller)
);

router.post(
    "/reactivate",
    controller.reactivateDoctor.bind(controller)
);

router.post(
    "/update-specialization",
    controller.updateSpecialization.bind(controller)
);

export default router;