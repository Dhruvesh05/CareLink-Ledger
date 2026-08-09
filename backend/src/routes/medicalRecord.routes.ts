import { Router } from "express";
import { MedicalRecordController } from "../controllers/MedicalRecordController";
import upload, { requireFile } from "../middleware/upload.middleware";

const router = Router();

const controller = new MedicalRecordController();

/*
==========================================================
MEDICAL RECORD
==========================================================
*/

// Create Record
router.post(
    "/create",
    upload.single("file"),
    requireFile,
    controller.createMedicalRecord.bind(controller)
);

// View Record (logs audit trail)
router.get(
    "/view/:recordId",
    controller.viewRecord.bind(controller)
);

// Update Record
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

// Grant Access
router.post(
    "/grant",
    controller.grantAccess.bind(controller)
);

// Revoke Access
router.post(
    "/revoke",
    controller.revokeAccess.bind(controller)
);

// Check whether a doctor currently holds patient-granted access
router.get(
    "/authorized/:recordId/:wallet",
    controller.isAuthorizedDoctor.bind(controller)
);

/*
==========================================================
RECORD LISTS
==========================================================
*/

// Records belonging to a Patient
router.get(
    "/patient/:wallet",
    controller.getPatientRecords.bind(controller)
);

// Records accessible to a Doctor
router.get(
    "/doctor/:wallet",
    controller.getDoctorRecords.bind(controller)
);

// Records created by a Hospital
router.get(
    "/hospital/:wallet",
    controller.getHospitalRecords.bind(controller)
);

/*
==========================================================
AUDIT
==========================================================
*/

// Log Download
router.post(
    "/download/:recordId",
    controller.logDownload.bind(controller)
);

/*
==========================================================
UTILITY
==========================================================
*/

// Check Record Exists
router.get(
    "/exists/:recordId",
    controller.recordExists.bind(controller)
);

// Total Records
router.get(
    "/stats/total",
    controller.totalRecords.bind(controller)
);

/*
==========================================================
GET / DEACTIVATE BY ID
==========================================================
Registered LAST — "/:recordId" is a single-segment catch-all and would
otherwise swallow any of the more specific single-segment-looking paths
above if it came first. All routes above are either two/three-segment
paths (no collision) or different HTTP methods, so this ordering is
safe, but keeping it last avoids any future foot-gun as routes are added.
*/

// Get Record by ID
router.get(
    "/:recordId",
    controller.getMedicalRecord.bind(controller)
);

// Deactivate Record
router.delete(
    "/:recordId",
    controller.deactivateMedicalRecord.bind(controller)
);

export default router;