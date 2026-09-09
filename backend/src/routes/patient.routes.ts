import { Router } from "express";
import { authenticate } from "../middleware/auth";

import { PatientController } from "../controllers/PatientController";

const router = Router();

// All business routes require JWT authentication.
router.use(authenticate);

const controller = new PatientController();

router.post(

    "/register",

    controller.registerPatient.bind(controller)

);

router.get(

    "/:wallet",

    controller.getPatient.bind(controller)

);

router.get(

    "/active/:wallet",

    controller.isPatientActive.bind(controller)

);

router.post(

    "/update-blood-group",

    controller.updateBloodGroup.bind(controller)

);

router.post(

    "/deactivate",

    controller.deactivatePatient.bind(controller)

);

router.post(

    "/reactivate",

    controller.reactivatePatient.bind(controller)

);

export default router;