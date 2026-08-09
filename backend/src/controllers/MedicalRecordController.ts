import { Request, Response } from "express";
import { ethers } from "ethers";

import { MedicalRecordService } from "../services/MedicalRecordService";
import { serializeBigInt } from "../utils/bigint";

/**
 * Status mapping based on the custom errors declared in MedicalRecord.sol.
 * If your deployed contract's error names differ, adjust these lists.
 */
const BAD_REQUEST_ERRORS = [
    "ZeroAddress",
    "InvalidPatient",
    "InvalidDoctor",
    "InvalidHospital",
    "EmptyIPFSHash",
    "EmptyFileHash",
    "InvalidCategory"
];

const FORBIDDEN_ERRORS = [
    "Unauthorized"
];

const NOT_FOUND_ERRORS = [
    "RecordNotFound"
];

const CONFLICT_ERRORS = [
    "InactiveRecord",
    "AlreadyInactive",
    "PatientInactive",
    "DoctorInactive",
    "DoctorNotVerified",
    "HospitalInactive",
    "HospitalNotVerified",
    "VersionMismatch",
    "DuplicateRecord",
    "AccessAlreadyGranted",
    "AccessNotGranted"
];

function resolveErrorText(error: any): string {

    return (
        error?.reason ||
        error?.shortMessage ||
        error?.message ||
        ""
    ).toString();

}

function statusForError(error: any): number {

    const errorText = resolveErrorText(error);

    if (BAD_REQUEST_ERRORS.some((name) => errorText.includes(name))) {
        return 400;
    }

    if (FORBIDDEN_ERRORS.some((name) => errorText.includes(name))) {
        return 403;
    }

    if (NOT_FOUND_ERRORS.some((name) => errorText.includes(name))) {
        return 404;
    }

    if (CONFLICT_ERRORS.some((name) => errorText.includes(name))) {
        return 409;
    }

    return 500;

}

function errorResponse(error: any) {

    return {
        success: false,
        message: error.message,
        reason: error.reason,
        code: error.code,
        shortMessage: error.shortMessage
    };

}

/**
 * Parses a route/body value into a positive integer recordId.
 * Returns null if invalid, so the caller can respond with 400.
 */
function parseRecordId(value: any): number | null {

    const recordId = Number(value);

    if (
        !Number.isInteger(recordId) ||
        recordId <= 0
    ) {
        return null;
    }

    return recordId;

}

export class MedicalRecordController {

    private medicalRecordService = new MedicalRecordService();

    /*
    ==========================================================
    CREATE MEDICAL RECORD
    POST /api/medical-records/create
    ==========================================================
    */

    async createMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const { patient, category, emergency } = req.body;

            // multer should place file on req.file (in-memory)
            const file = req.file as Express.Multer.File | undefined;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: "Missing file upload"
                });
            }

            if (!patient || !ethers.isAddress(patient)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid patient wallet address"
                });
            }

            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: "category is required"
                });
            }

            const transaction = await this.medicalRecordService.createMedicalRecord(
                patient,
                file,
                category,
                Boolean(emergency)
            );

            return res.status(201).json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        }

        catch (error: any) {

            console.error("Create Medical Record Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    GET MEDICAL RECORD
    GET /api/medical-records/:recordId
    ==========================================================
    */

    async getMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const recordId = parseRecordId(req.params.recordId);

            if (recordId === null) {
                return res.status(400).json({
                    success: false,
                    message: "recordId must be a positive integer"
                });
            }

            const record =
                await this.medicalRecordService.getMedicalRecord(
                    recordId
                );

            return res.json({
                success: true,
                record: serializeBigInt(record)
            });

        }

        catch (error: any) {

            console.error("Get Medical Record Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    VIEW RECORD (writes a VIEW_RECORD audit entry)
    GET /api/medical-records/view/:recordId
    ==========================================================
    */

    async viewRecord(
        req: Request,
        res: Response
    ) {

        try {

            const recordId = parseRecordId(req.params.recordId);

            if (recordId === null) {
                return res.status(400).json({
                    success: false,
                    message: "recordId must be a positive integer"
                });
            }

            const record =
                await this.medicalRecordService.viewRecord(
                    recordId
                );

            return res.json({
                success: true,
                record: serializeBigInt(record)
            });

        }

        catch (error: any) {

            console.error("View Record Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    UPDATE RECORD
    PUT /api/medical-records/update
    ==========================================================
    */

    async updateMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {
            const {
                recordId: rawRecordId,
                expectedVersion: rawExpectedVersion,
                category
            } = req.body;

            const file = req.file as Express.Multer.File | undefined;

            const recordId = parseRecordId(rawRecordId);

            if (recordId === null) {
                return res.status(400).json({
                    success: false,
                    message: "recordId must be a positive integer"
                });
            }

            const expectedVersion = Number(rawExpectedVersion);

            if (
                !Number.isInteger(expectedVersion) ||
                expectedVersion <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "expectedVersion must be a positive integer"
                });
            }


            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: "Missing file upload for update"
                });
            }

            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: "category is required"
                });
            }

            const transaction = await this.medicalRecordService.updateMedicalRecord(
                recordId,
                file,
                category,
                expectedVersion
            );

            return res.json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        }

        catch (error: any) {

            console.error("Update Medical Record Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    DEACTIVATE RECORD
    DELETE /api/medical-records/:recordId
    ==========================================================
    */

    async deactivateMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const recordId = parseRecordId(req.params.recordId);

            if (recordId === null) {
                return res.status(400).json({
                    success: false,
                    message: "recordId must be a positive integer"
                });
            }

            const transaction =
                await this.medicalRecordService.deactivateMedicalRecord(
                    recordId
                );

            return res.json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        }

        catch (error: any) {

            console.error("Deactivate Medical Record Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    GRANT ACCESS
    POST /api/medical-records/grant
    ==========================================================
    */

    async grantAccess(
        req: Request,
        res: Response
    ) {

        try {

            const {
                recordId: rawRecordId,
                doctor
            } = req.body;

            const recordId = parseRecordId(rawRecordId);

            if (recordId === null) {
                return res.status(400).json({
                    success: false,
                    message: "recordId must be a positive integer"
                });
            }

            if (!doctor || !ethers.isAddress(doctor)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid doctor wallet address"
                });
            }

            const transaction =
                await this.medicalRecordService.grantAccess(
                    recordId,
                    doctor
                );

            return res.json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        }

        catch (error: any) {

            console.error("Grant Access Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    REVOKE ACCESS
    POST /api/medical-records/revoke
    ==========================================================
    */

    async revokeAccess(
        req: Request,
        res: Response
    ) {

        try {

            const {
                recordId: rawRecordId,
                doctor
            } = req.body;

            const recordId = parseRecordId(rawRecordId);

            if (recordId === null) {
                return res.status(400).json({
                    success: false,
                    message: "recordId must be a positive integer"
                });
            }

            if (!doctor || !ethers.isAddress(doctor)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid doctor wallet address"
                });
            }

            const transaction =
                await this.medicalRecordService.revokeAccess(
                    recordId,
                    doctor
                );

            return res.json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        }

        catch (error: any) {

            console.error("Revoke Access Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    IS AUTHORIZED DOCTOR
    GET /api/medical-records/authorized/:recordId/:wallet
    ==========================================================
    */

    async isAuthorizedDoctor(
        req: Request,
        res: Response
    ) {

        try {

            const recordId = parseRecordId(req.params.recordId);

            if (recordId === null) {
                return res.status(400).json({
                    success: false,
                    message: "recordId must be a positive integer"
                });
            }

            const { wallet } = req.params;

            if (!wallet || !ethers.isAddress(wallet)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
                });
            }

            const authorized =
                await this.medicalRecordService.isAuthorizedDoctor(
                    recordId,
                    wallet
                );

            return res.json({
                success: true,
                authorized
            });

        }

        catch (error: any) {

            console.error("Is Authorized Doctor Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    PATIENT RECORDS
    GET /api/medical-records/patient/:wallet
    ==========================================================
    */

    async getPatientRecords(
        req: Request,
        res: Response
    ) {

        try {

            const { wallet } = req.params;

            if (!wallet || !ethers.isAddress(wallet)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
                });
            }

            const records =
                await this.medicalRecordService.getPatientRecords(
                    wallet
                );

            return res.json({
                success: true,
                records: serializeBigInt(records)
            });

        }

        catch (error: any) {

            console.error("Get Patient Records Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    DOCTOR RECORDS
    GET /api/medical-records/doctor/:wallet
    ==========================================================
    */

    async getDoctorRecords(
        req: Request,
        res: Response
    ) {

        try {

            const { wallet } = req.params;

            if (!wallet || !ethers.isAddress(wallet)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
                });
            }

            const records =
                await this.medicalRecordService.getDoctorRecords(
                    wallet
                );

            return res.json({
                success: true,
                records: serializeBigInt(records)
            });

        }

        catch (error: any) {

            console.error("Get Doctor Records Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    HOSPITAL RECORDS
    GET /api/medical-records/hospital/:wallet
    ==========================================================
    */

    async getHospitalRecords(
        req: Request,
        res: Response
    ) {

        try {

            const { wallet } = req.params;

            if (!wallet || !ethers.isAddress(wallet)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
                });
            }

            const records =
                await this.medicalRecordService.getHospitalRecords(
                    wallet
                );

            return res.json({
                success: true,
                records: serializeBigInt(records)
            });

        }

        catch (error: any) {

            console.error("Get Hospital Records Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    DOWNLOAD AUDIT (writes a DOWNLOAD_RECORD audit entry)
    POST /api/medical-records/download/:recordId
    ==========================================================
    */

    async logDownload(
        req: Request,
        res: Response
    ) {

        try {

            const recordId = parseRecordId(req.params.recordId);

            if (recordId === null) {
                return res.status(400).json({
                    success: false,
                    message: "recordId must be a positive integer"
                });
            }

            const record =
                await this.medicalRecordService.logDownload(
                    recordId
                );

            return res.json({
                success: true,
                record: serializeBigInt(record)
            });

        }

        catch (error: any) {

            console.error("Log Download Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    RECORD EXISTS
    GET /api/medical-records/exists/:recordId
    ==========================================================
    */

    async recordExists(
        req: Request,
        res: Response
    ) {

        try {

            const recordId = parseRecordId(req.params.recordId);

            if (recordId === null) {
                return res.status(400).json({
                    success: false,
                    message: "recordId must be a positive integer"
                });
            }

            const exists =
                await this.medicalRecordService.recordExists(
                    recordId
                );

            return res.json({
                success: true,
                exists
            });

        }

        catch (error: any) {

            console.error("Record Exists Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    TOTAL RECORDS
    GET /api/medical-records/stats/total
    ==========================================================
    */

    async totalRecords(
        req: Request,
        res: Response
    ) {

        try {

            const total =
                await this.medicalRecordService.totalRecords();

            return res.json({
                success: true,
                total: serializeBigInt(total)
            });

        }

        catch (error: any) {

            console.error("Total Records Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

}