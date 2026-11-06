import { Request, Response } from "express";

import {
    AnalyticsClientError,
    type AnalyticsAnalysisResponse
} from "../services/AnalyticsClient";
import {
    AnalyticsUploadService
} from "../services/AnalyticsUploadService";
import { sendError, sendSuccess } from "../../utils/response";
import MedicalRecordModel from "../../models/MedicalRecordModel";
import FhirProcessingResultModel from "../../models/FhirProcessingResultModel";
import AccessRequestModel from "../../models/AccessRequest";

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

    async analyzeMedicalRecord(req: Request, res: Response) {
            if (!req.file || !req.auth?.userId) {
                return sendError(res, "Authenticated record upload is required", 400);
            }

            const recordId = Number(req.params.recordId);
            if (!Number.isSafeInteger(recordId) || recordId <= 0) {
                return sendError(res, "Invalid medical record ID", 400);
            }

            const recordFilter: Record<string, unknown> = { recordId };
            if (req.careLinkNetwork) {
                recordFilter.chainId = req.careLinkNetwork.chainId;
                recordFilter.contractAddress =
                    req.careLinkNetwork.medicalRecordAddress.toLowerCase();
            }
            const record = await MedicalRecordModel.findOne(recordFilter).lean().exec();
            if (!record) {
                return sendError(res, "Medical record was not found", 404);
            }

            if (!record.patientUserId) {
                return sendError(
                    res,
                    "This historical record has no verified patient identity binding",
                    409
                );
            }

            if (
                req.auth.role === "Patient" &&
                record.patientUserId !== req.auth.userId
            ) {
                return sendError(res, "You are not authorized to process this record", 403);
            }
            if (req.auth.role === "Doctor") {
                const grant = await AccessRequestModel.findOne({
                    doctorUserId: req.auth.userId,
                    status: "active",
                    permissionType: "READ_ONLY",
                    recordIds: recordId,
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gt: new Date() } }
                    ]
                }).select("_id").lean().exec();
                if (!grant) {
                    return sendError(res, "Active READ_ONLY consent is required", 403);
                }
            }

            const processing = await FhirProcessingResultModel.create({
                patientUserId: record.patientUserId,
                recordId,
                originalCid: record.cid,
                status: "processing"
            });

            try {
                const result = await this.uploadService.analyzeUpload({
                    buffer: req.file.buffer,
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    context: {
                        patientId: record.patientUserId,
                        medicalRecordId: recordId,
                        originalRecordReference: record.cid
                    }
                });
                await FhirProcessingResultModel.updateOne(
                    { _id: processing._id },
                    { $set: { status: "completed", result } }
                ).exec();
                return sendSuccess(res, "Medical record analysis completed", {
                    processingId: String(processing._id),
                    recordId,
                    patientUserId: record.patientUserId,
                    originalCid: record.cid,
                    result
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "FHIR processing failed";
                await FhirProcessingResultModel.updateOne(
                    { _id: processing._id },
                    { $set: { status: "failed", errorMessage: message } }
                ).exec();
                if (error instanceof AnalyticsClientError) {
                    return sendError(res, error.message, statusForAnalyticsError(error), {
                        code: error.code,
                        processingId: String(processing._id)
                    });
                }
                return sendError(res, message, 502);
            }
        }

        async getMedicalRecordProcessingResult(req: Request, res: Response) {
            if (!req.auth?.userId) {
                return sendError(res, "Authentication required", 401);
            }

            const recordId = Number(req.params.recordId);
            if (!Number.isSafeInteger(recordId) || recordId <= 0) {
                return sendError(res, "Invalid medical record ID", 400);
            }

            const processing = await FhirProcessingResultModel.findOne({
                _id: req.params.processingId,
                recordId
            }).lean().exec();

            if (!processing) {
                return sendError(res, "FHIR processing result was not found", 404);
            }

            const record = await MedicalRecordModel.findOne({
                recordId,
                patientUserId: processing.patientUserId
            }).select("patientUserId").lean().exec();

            if (!record) {
                return sendError(res, "FHIR processing result is not linked to the record owner", 409);
            }

            if (
                req.auth.role === "Patient" &&
                record.patientUserId !== req.auth.userId
            ) {
                return sendError(res, "You are not authorized to view this result", 403);
            }
            if (req.auth.role === "Doctor") {
                const grant = await AccessRequestModel.findOne({
                    doctorUserId: req.auth.userId,
                    status: "active",
                    permissionType: "READ_ONLY",
                    recordIds: recordId,
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gt: new Date() } }
                    ]
                }).select("_id").lean().exec();
                if (!grant) {
                    return sendError(res, "Active READ_ONLY consent is required", 403);
                }
            }

            return sendSuccess(res, "FHIR processing result retrieved", {
                processingId: String(processing._id),
                recordId: processing.recordId,
                patientUserId: processing.patientUserId,
                originalCid: processing.originalCid,
                status: processing.status,
                result: processing.result,
                errorMessage: processing.errorMessage
            });
        }
}

export default AnalyticsController;
