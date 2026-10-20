import { Request, Response } from "express";

import {
    AnalyticsClientError,
    type AnalyticsAnalysisResponse
} from "../services/AnalyticsClient";
import {
    AnalyticsUploadService
} from "../services/AnalyticsUploadService";
import { sendError, sendSuccess } from "../../utils/response";

function statusForAnalyticsError(error: AnalyticsClientError): number {
    switch (error.code) {
        case "ANALYTICS_INVALID_UPLOAD":
            return 400;
        case "ANALYTICS_TIMEOUT":
            return 504;
        case "ANALYTICS_NOT_CONFIGURED":
        case "ANALYTICS_UNAVAILABLE":
            return 503;
        case "ANALYTICS_UPSTREAM_ERROR":
        case "ANALYTICS_INVALID_RESPONSE":
            return 502;
    }
}

export class AnalyticsController {
    private readonly uploadService: AnalyticsUploadService;

    constructor(uploadService = new AnalyticsUploadService()) {
        this.uploadService = uploadService;
    }

    async analyze(req: Request, res: Response) {
        if (!req.file) {
            return sendError(res, "Missing file upload", 400);
        }

        try {
            const result: AnalyticsAnalysisResponse =
                await this.uploadService.analyzeUpload({
                    buffer: req.file.buffer,
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype
                });

            return sendSuccess(res, "Analytics analysis completed", result);
        } catch (error) {
            if (error instanceof AnalyticsClientError) {
                return sendError(
                    res,
                    error.message,
                    statusForAnalyticsError(error),
                    { code: error.code }
                );
            }

            return sendError(res, "Analytics analysis failed", 502);
        }
    }
}

export default AnalyticsController;

