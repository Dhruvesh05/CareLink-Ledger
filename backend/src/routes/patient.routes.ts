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

export default router;