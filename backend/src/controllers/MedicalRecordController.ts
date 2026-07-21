import { Request, Response } from "express";
import { MedicalRecordService } from "../services/MedicalRecordService";

export class MedicalRecordController {

    private medicalRecordService = new MedicalRecordService();

    /*
    ==========================================================
    CREATE MEDICAL RECORD
    ==========================================================
    */

    async createMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const {
                patient,
                ipfsHash,
                fileHash,
                category,
                emergency
            } = req.body;

            const receipt =
                await this.medicalRecordService.createMedicalRecord(
                    patient,
                    ipfsHash,
                    fileHash,
                    category,
                    emergency
                );

            return res.status(201).json({
                success: true,
                transaction: receipt
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    GET MEDICAL RECORD
    ==========================================================
    */

    async getMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const record =
                await this.medicalRecordService.getMedicalRecord(
                    Number(req.params.recordId)
                );

            return res.json({
                success: true,
                record
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    VIEW RECORD
    ==========================================================
    */

    async viewRecord(
        req: Request,
        res: Response
    ) {

        try {

            const record =
                await this.medicalRecordService.viewRecord(
                    Number(req.params.recordId)
                );

            return res.json({
                success: true,
                record
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    UPDATE RECORD
    ==========================================================
    */

    async updateMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const {
                recordId,
                ipfsHash,
                fileHash,
                category,
                expectedVersion
            } = req.body;

            const receipt =
                await this.medicalRecordService.updateMedicalRecord(
                    recordId,
                    ipfsHash,
                    fileHash,
                    category,
                    expectedVersion
                );

            return res.json({
                success: true,
                transaction: receipt
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    DEACTIVATE RECORD
    ==========================================================
    */

    async deactivateMedicalRecord(
        req: Request,
        res: Response
    ) {

        try {

            const receipt =
                await this.medicalRecordService.deactivateMedicalRecord(
                    Number(req.params.recordId)
                );

            return res.json({
                success: true,
                transaction: receipt
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    GRANT ACCESS
    ==========================================================
    */

    async grantAccess(
        req: Request,
        res: Response
    ) {

        try {

            const {
                recordId,
                doctor
            } = req.body;

            const receipt =
                await this.medicalRecordService.grantAccess(
                    recordId,
                    doctor
                );

            return res.json({
                success: true,
                transaction: receipt
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    REVOKE ACCESS
    ==========================================================
    */

    async revokeAccess(
        req: Request,
        res: Response
    ) {

        try {

            const {
                recordId,
                doctor
            } = req.body;

            const receipt =
                await this.medicalRecordService.revokeAccess(
                    recordId,
                    doctor
                );

            return res.json({
                success: true,
                transaction: receipt
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    PATIENT RECORDS
    ==========================================================
    */

    async getPatientRecords(
        req: Request,
        res: Response
    ) {

        try {

            const records =
                await this.medicalRecordService.getPatientRecords(
                    req.params.wallet
                );

            return res.json({
                success: true,
                records
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    DOCTOR RECORDS
    ==========================================================
    */

    async getDoctorRecords(
        req: Request,
        res: Response
    ) {

        try {

            const records =
                await this.medicalRecordService.getDoctorRecords(
                    req.params.wallet
                );

            return res.json({
                success: true,
                records
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    HOSPITAL RECORDS
    ==========================================================
    */

    async getHospitalRecords(
        req: Request,
        res: Response
    ) {

        try {

            const records =
                await this.medicalRecordService.getHospitalRecords(
                    req.params.wallet
                );

            return res.json({
                success: true,
                records
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    DOWNLOAD AUDIT
    ==========================================================
    */

    async logDownload(
        req: Request,
        res: Response
    ) {

        try {

            const receipt =
                await this.medicalRecordService.logDownload(
                    Number(req.params.recordId)
                );

            return res.json({
                success: true,
                transaction: receipt
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    RECORD EXISTS
    ==========================================================
    */

    async recordExists(
        req: Request,
        res: Response
    ) {

        try {

            const exists =
                await this.medicalRecordService.recordExists(
                    Number(req.params.recordId)
                );

            return res.json({
                success: true,
                exists
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /*
    ==========================================================
    TOTAL RECORDS
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
                total
            });

        }

        catch (error: any) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

}