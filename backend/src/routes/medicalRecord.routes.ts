import { Router } from "express";
import { authenticate } from "../middleware/auth";

import {
    MedicalRecordController
} from "../controllers/MedicalRecordController";

import upload, {
    requireFile
} from "../middleware/upload.middleware";

const router = Router();

// All business routes require JWT authentication.
router.use(authenticate);

const controller =
    new MedicalRecordController();

/*
==========================================================
CREATE
==========================================================
*/

router.post(
    "/prepare",
    upload.single("file"),
    requireFile,
    controller.prepareMedicalRecord.bind(controller)
);

router.post(
    "/confirm",
    controller.confirmMedicalRecord.bind(controller)
);

/*
==========================================================
LEGACY CREATE — DISABLED

Medical-record creation must now use:

    POST /prepare
        ↓
    Doctor wallet signs transaction
        ↓
    POST /confirm

The legacy /create endpoint previously submitted the
blockchain transaction using the backend signer, which
would make msg.sender equal to the backend wallet rather
than the authenticated doctor's wallet.
==========================================================
*/
router.post(
    "/create",
    (_req, res) => {
        return res.status(410).json({
            success: false,
            message:
                "Legacy medical record creation is disabled. Use /prepare and /confirm with the authenticated doctor's wallet."
        });
    }
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