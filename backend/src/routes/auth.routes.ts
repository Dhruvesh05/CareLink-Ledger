import { Router } from "express";
import { AuditController } from "../controllers/AuditController";

const router = Router();

const controller = new AuditController();

/*
==========================================================
RECORD AUDIT LOGS
==========================================================
*/

// Audit Logs for a Medical Record
router.get(
    "/record/:recordId",
    controller.getRecordAuditLogs.bind(controller)
);

/*
==========================================================
UTILITY
==========================================================
*/

// Total Audit Logs
router.get(
    "/stats/total",
    controller.totalAuditLogs.bind(controller)
);

/*
==========================================================
GET BY ID
==========================================================
Registered LAST — "/:logId" is a single-segment catch-all and would
otherwise swallow more specific single-segment-looking paths if
registered first. Neither route above collides today since both are
two-segment paths, but keeping the catch-all last is the safe default,
matching the convention used in medicalRecord.routes.ts.
*/

// Get Audit Log by ID
router.get(
    "/:logId",
    controller.getAudit.bind(controller)
);

export default router;