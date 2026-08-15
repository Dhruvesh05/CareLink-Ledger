import { Router } from "express";

import {
    MedicalRecordController
} from "../controllers/MedicalRecordController";

import upload, {
    requireFile
} from "../middleware/upload.middleware";

const router = Router();

const controller =
    new MedicalRecordController();

/*
==========================================================
CREATE
==========================================================
*/

router.post(
    "/create",
    upload.single("file"),
    requireFile,
    controller.createMedicalRecord.bind(controller)
);

/*
==========================================================
READ
==========================================================
*/

router.get(
    "/view/:recordId",
    controller.viewRecord.bind(controller)
);

router.get(
    "/patient/:wallet",
    controller.getPatientRecords.bind(controller)
);

router.get(
    "/doctor/:wallet",
    controller.getDoctorRecords.bind(controller)
);

router.get(
    "/hospital/:wallet",
    controller.getHospitalRecords.bind(controller)
);

router.get(
    "/authorized/:recordId/:wallet",
    controller.isAuthorizedDoctor.bind(controller)
);

router.get(
    "/exists/:recordId",
    controller.recordExists.bind(controller)
);

router.get(
    "/stats/total",
    controller.totalRecords.bind(controller)
);

/*
==========================================================
UPDATE
==========================================================
*/

router.put(
    "/update",
    upload.single("file"),
    requireFile,
    controller.updateMedicalRecord.bind(controller)
);

/*
==========================================================
ACCESS CONTROL
==========================================================
*/

router.post(
    "/grant",
    controller.grantAccess.bind(controller)
);

router.post(
    "/revoke",
    controller.revokeAccess.bind(controller)
);

/*
==========================================================
AUDIT
==========================================================
*/

router.post(
    "/download/:recordId",
    controller.logDownload.bind(controller)
);

/*
==========================================================
DEACTIVATE
==========================================================
*/

router.delete(
    "/:recordId",
    controller.deactivateMedicalRecord.bind(controller)
);

/*
==========================================================
GET RECORD BY ID
==========================================================
*/

router.get(
    "/:recordId",
    controller.getMedicalRecord.bind(controller)
);

export default router;