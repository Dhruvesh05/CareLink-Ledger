import { Router } from "express";

import { PatientController } from "../controllers/PatientController";

const router = Router();

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