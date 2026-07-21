import { Router } from "express";
import { MedicalRecordController } from "../controllers/MedicalRecordController";

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
    controller.createMedicalRecord.bind(controller)
);

// Get Record by ID
router.get(
    "/:recordId",
    controller.getMedicalRecord.bind(controller)
);

// View Record (logs audit trail)
router.get(
    "/view/:recordId",
    controller.viewRecord.bind(controller)
);

// Update Record
router.put(
    "/update",
    controller.updateMedicalRecord.bind(controller)
);

// Deactivate Record
router.delete(
    "/:recordId",
    controller.deactivateMedicalRecord.bind(controller)
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

export default router;