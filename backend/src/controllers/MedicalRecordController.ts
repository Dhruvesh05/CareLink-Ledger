import {
    Request,
    Response
} from "express";

import { ethers } from "ethers";

import {
    MedicalRecordService
} from "../services/MedicalRecordService";

import IPFSServiceAdapter
    from "../ipfs/adapters/IPFSServiceAdapter";

import {
    serializeBigInt
} from "../utils/bigint";

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

function parseRecordId(
    value: unknown
): number | null {

    const recordId =
        Number(value);

    if (
        !Number.isSafeInteger(recordId) ||
        recordId <= 0
    ) {
        return null;
    }

    return recordId;
}

function parsePositiveInteger(
    value: unknown,
    field: string
): number {

    const number =
        Number(value);

    if (
        !Number.isSafeInteger(number) ||
        number <= 0
    ) {
        throw new Error(
            `${field} must be a positive integer`
        );
    }

    return number;
}

function parseEmergency(
    value: unknown
): boolean {

    if (
        value === true ||
        value === "true"
    ) {
        return true;
    }

    if (
        value === false ||
        value === "false"
    ) {
        return false;
    }

    throw new Error(
        "emergency must be true or false"
    );
}

function requireString(
    value: unknown,
    field: string
): string {

    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new Error(
            `${field} is required`
        );
    }

    return value.trim();
}

function requireAddress(
    value: unknown,
    field: string
): string {

    const address =
        requireString(value, field);

    if (!ethers.isAddress(address)) {
        throw new Error(
            `Invalid ${field} wallet address`
        );
    }

    return address;
}

function getErrorText(
    error: any
): string {

    return [
        error?.reason,
        error?.shortMessage,
        error?.message,
        error?.error?.reason,
        error?.error?.message
    ]
        .filter(Boolean)
        .join(" ");
}

function getStatusCode(
    error: any
): number {

    const text =
        getErrorText(error);

    if (
        text.includes(
            "must be true or false"
        )
    ) {
        return 400;
    }

    if (
        BAD_REQUEST_ERRORS.some(
            name => text.includes(name)
        )
    ) {
        return 400;
    }

    if (
        FORBIDDEN_ERRORS.some(
            name => text.includes(name)
        )
    ) {
        return 403;
    }

    if (
        NOT_FOUND_ERRORS.some(
            name => text.includes(name)
        )
    ) {
        return 404;
    }

    if (
        CONFLICT_ERRORS.some(
            name => text.includes(name)
        )
    ) {
        return 409;
    }

    return 500;
}

function sendError(
    res: Response,
    error: any
) {

    const status =
        getStatusCode(error);

    const message =
        error?.shortMessage ||
        error?.reason ||
        error?.message ||
        "Request failed";

    return res.status(status).json({
        success: false,
        message,
        code:
            error?.code ||
            undefined
    });
}

export class MedicalRecordController {

    private readonly medicalRecordService:
        MedicalRecordService;

    constructor(
        medicalRecordService?: MedicalRecordService
    ) {

        this.medicalRecordService =
            medicalRecordService ||
            new MedicalRecordService(
                new IPFSServiceAdapter()
            );
    }

    async createMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const patient =
                requireAddress(
                    req.body.patient,
                    "patient"
                );

            const category =
                requireString(
                    req.body.category,
                    "category"
                );

            const emergency =
                parseEmergency(
                    req.body.emergency
                );

            const file =
                req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Missing file upload"
                });
            }

            const transaction =
                await this.medicalRecordService
                    .createMedicalRecord(
                        patient,
                        file,
                        category,
                        emergency
                    );

            return res.status(201).json({
                success: true,
                transaction:
                    serializeBigInt(transaction)
            });

        } catch (error) {

            console.error(
                "Create Medical Record Error:",
                error
            );

            return sendError(
                res,
                error
            );
        }
    }

    async getMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const recordId =
                parsePositiveInteger(
                    req.params.recordId,
                    "recordId"
                );

            const record =
                await this.medicalRecordService
                    .getMedicalRecord(recordId);

            return res.json({
                success: true,
                record:
                    serializeBigInt(record)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async viewRecord(
        req: Request,
        res: Response
    ) {

        try {

            const recordId =
                parsePositiveInteger(
                    req.params.recordId,
                    "recordId"
                );

            const record =
                await this.medicalRecordService
                    .viewRecord(recordId);

            return res.json({
                success: true,
                record:
                    serializeBigInt(record)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async updateMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const recordId =
                parsePositiveInteger(
                    req.body.recordId,
                    "recordId"
                );

            const expectedVersion =
                parsePositiveInteger(
                    req.body.expectedVersion,
                    "expectedVersion"
                );

            const category =
                requireString(
                    req.body.category,
                    "category"
                );

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Missing file upload for update"
                });
            }

            const transaction =
                await this.medicalRecordService
                    .updateMedicalRecord(
                        recordId,
                        req.file,
                        category,
                        expectedVersion
                    );

            return res.json({
                success: true,
                transaction:
                    serializeBigInt(transaction)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async deactivateMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const recordId =
                parsePositiveInteger(
                    req.params.recordId,
                    "recordId"
                );

            const transaction =
                await this.medicalRecordService
                    .deactivateMedicalRecord(
                        recordId
                    );

            return res.json({
                success: true,
                transaction:
                    serializeBigInt(transaction)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async grantAccess(
        req: Request,
        res: Response
    ) {

        try {

            const recordId =
                parsePositiveInteger(
                    req.body.recordId,
                    "recordId"
                );

            const doctor =
                requireAddress(
                    req.body.doctor,
                    "doctor"
                );

            const transaction =
                await this.medicalRecordService
                    .grantAccess(
                        recordId,
                        doctor
                    );

            return res.json({
                success: true,
                transaction:
                    serializeBigInt(transaction)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async revokeAccess(
        req: Request,
        res: Response
    ) {

        try {

            const recordId =
                parsePositiveInteger(
                    req.body.recordId,
                    "recordId"
                );

            const doctor =
                requireAddress(
                    req.body.doctor,
                    "doctor"
                );

            const transaction =
                await this.medicalRecordService
                    .revokeAccess(
                        recordId,
                        doctor
                    );

            return res.json({
                success: true,
                transaction:
                    serializeBigInt(transaction)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async isAuthorizedDoctor(
        req: Request,
        res: Response
    ) {

        try {

            const recordId =
                parsePositiveInteger(
                    req.params.recordId,
                    "recordId"
                );

            const wallet =
                requireAddress(
                    req.params.wallet,
                    "wallet"
                );

            const authorized =
                await this.medicalRecordService
                    .isAuthorizedDoctor(
                        recordId,
                        wallet
                    );

            return res.json({
                success: true,
                authorized
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async getPatientRecords(
        req: Request,
        res: Response
    ) {

        try {

            const wallet =
                requireAddress(
                    req.params.wallet,
                    "wallet"
                );

            const records =
                await this.medicalRecordService
                    .getPatientRecords(wallet);

            return res.json({
                success: true,
                records:
                    serializeBigInt(records)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async getDoctorRecords(
        req: Request,
        res: Response
    ) {

        try {

            const wallet =
                requireAddress(
                    req.params.wallet,
                    "wallet"
                );

            const records =
                await this.medicalRecordService
                    .getDoctorRecords(wallet);

            return res.json({
                success: true,
                records:
                    serializeBigInt(records)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async getHospitalRecords(
        req: Request,
        res: Response
    ) {

        try {

            const wallet =
                requireAddress(
                    req.params.wallet,
                    "wallet"
                );

            const records =
                await this.medicalRecordService
                    .getHospitalRecords(wallet);

            return res.json({
                success: true,
                records:
                    serializeBigInt(records)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async logDownload(
        req: Request,
        res: Response
    ) {

        try {

            const recordId =
                parsePositiveInteger(
                    req.params.recordId,
                    "recordId"
                );

            const transaction =
                await this.medicalRecordService
                    .logDownload(recordId);

            return res.json({
                success: true,
                transaction:
                    serializeBigInt(transaction)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async recordExists(
        req: Request,
        res: Response
    ) {

        try {

            const recordId =
                parsePositiveInteger(
                    req.params.recordId,
                    "recordId"
                );

            const exists =
                await this.medicalRecordService
                    .recordExists(recordId);

            return res.json({
                success: true,
                exists
            });

        } catch (error) {

            return sendError(res, error);
        }
    }

    async totalRecords(
        _req: Request,
        res: Response
    ) {

        try {

            const total =
                await this.medicalRecordService
                    .totalRecords();

            return res.json({
                success: true,
                total:
                    serializeBigInt(total)
            });

        } catch (error) {

            return sendError(res, error);
        }
    }
}