import { Router } from "express";

import { authenticate, requireRole } from "../middleware/auth";
import AnalyticsController from "../analytics/controllers/AnalyticsController";
import {
    analyticsUpload,
    handleAnalyticsUploadError,
    requireAnalyticsFile
} from "../analytics/middleware/analyticsUpload.middleware";
import { requireCareLinkRole } from "../ssi/middleware/carelinkAuthorization";

const router = Router();
const controller = new AnalyticsController();

router.post(
    "/analyze",
    authenticate,
    requireRole("Admin", "Doctor", "Hospital"),
    analyticsUpload.single("file"),
    handleAnalyticsUploadError,
    requireAnalyticsFile,
    controller.analyze.bind(controller)
);

router.post(
    "/medical-record/:recordId",
    authenticate,
    requireCareLinkRole("Admin", "Patient", "Doctor"),
    requireRole("Admin", "Patient", "Doctor"),
    analyticsUpload.single("file"),
    handleAnalyticsUploadError,
    requireAnalyticsFile,
    controller.analyzeMedicalRecord.bind(controller)
);

router.get(
    "/medical-record/:recordId/results/:processingId",
    authenticate,
    requireCareLinkRole("Admin", "Patient", "Doctor"),
    requireRole("Admin", "Patient", "Doctor"),
    controller.getMedicalRecordProcessingResult.bind(controller)
);

export default router;
