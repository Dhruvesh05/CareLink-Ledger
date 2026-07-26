import { Request, Response } from "express";
import { ethers } from "ethers";

import { AuditService } from "../services/AuditService";
import { serializeBigInt } from "../utils/bigint";

/**
 * Status mapping based on the custom errors declared in AuditLog.sol.
 * If your deployed contract's error names differ, adjust these lists.
 */
const BAD_REQUEST_ERRORS = [
    "ZeroAddress"
];

const FORBIDDEN_ERRORS = [
    "Unauthorized"
];

const NOT_FOUND_ERRORS = [
    "AuditNotFound"
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
 * Parses a route value into a positive integer logId.
 * Returns null if invalid, so the caller can respond with 400.
 */
function parseLogId(value: any): number | null {

    const logId = Number(value);

    if (
        !Number.isInteger(logId) ||
        logId <= 0
    ) {
        return null;
    }

    return logId;

}

/**
 * Parses a route value into a positive integer recordId.
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

export class AuditController {

    private auditService = new AuditService();

    /*
    ==========================================================
    GET AUDIT
    GET /api/audit/:logId
    ==========================================================
    */

    async getAudit(
        req: Request,
        res: Response
    ) {

        try {

            const logId = parseLogId(req.params.logId);

            if (logId === null) {
                return res.status(400).json({
                    success: false,
                    message: "logId must be a positive integer"
                });
            }

            const audit =
                await this.auditService.getAudit(
                    logId
                );

            return res.json({
                success: true,
                audit: serializeBigInt(audit)
            });

        }

        catch (error: any) {

            console.error("Get Audit Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    GET RECORD AUDIT LOGS
    GET /api/audit/record/:recordId
    ==========================================================
    */

    async getRecordAuditLogs(
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

            const logs =
                await this.auditService.getRecordAuditLogs(
                    recordId
                );

            return res.json({
                success: true,
                logs: serializeBigInt(logs)
            });

        }

        catch (error: any) {

            console.error("Get Record Audit Logs Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /*
    ==========================================================
    TOTAL AUDIT LOGS
    GET /api/audit/stats/total
    ==========================================================
    */

    async totalAuditLogs(
        req: Request,
        res: Response
    ) {

        try {

            const total =
                await this.auditService.totalAuditLogs();

            return res.json({
                success: true,
                total: serializeBigInt(total)
            });

        }

        catch (error: any) {

            console.error("Total Audit Logs Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

}