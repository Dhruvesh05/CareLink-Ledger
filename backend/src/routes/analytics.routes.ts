import { Router } from "express";

import { authenticate, requireRole } from "../middleware/auth";
import AnalyticsController from "../analytics/controllers/AnalyticsController";
import {
    analyticsUpload,
    handleAnalyticsUploadError,
    requireAnalyticsFile
} from "../analytics/middleware/analyticsUpload.middleware";

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

export default router;

