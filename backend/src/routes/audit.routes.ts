import { Router } from "express";
import { AuditController } from "../controllers/AuditController";

const router = Router();

const controller = new AuditController();

router.get(
    "/:logId",
    controller.getAudit.bind(controller)
);

router.get(
    "/record/:recordId",
    controller.getRecordAuditLogs.bind(controller)
);

router.get(
    "/stats/total",
    controller.totalAuditLogs.bind(controller)
);

export default router;