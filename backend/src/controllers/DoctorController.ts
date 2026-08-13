import { Request, Response } from "express";
import { serializeBigInt } from "../utils/bigint";
import { DoctorService } from "../services/DoctorService";

export class DoctorController {

    private doctorService = new DoctorService();

    /*
    ==========================================================
    POST /api/doctors/register
    ==========================================================
    */
    async registerDoctor(req: Request, res: Response) {

        try {

            const {
                fullNameHash,
                licenseNumberHash,
                specialization,
                hospital,
            } = req.body as { [key: string]: any };

            const fullNameHashStr = Array.isArray(fullNameHash) ? fullNameHash[0] : fullNameHash;
            const licenseNumberHashStr = Array.isArray(licenseNumberHash) ? licenseNumberHash[0] : licenseNumberHash;
            const specializationStr = Array.isArray(specialization) ? specialization[0] : specialization;
            const hospitalStr = Array.isArray(hospital) ? hospital[0] : hospital;

            if (
                !fullNameHashStr ||
                !licenseNumberHashStr ||
                !specializationStr ||
                !hospitalStr ||
                typeof fullNameHashStr !== "string" ||
                typeof licenseNumberHashStr !== "string" ||
                typeof specializationStr !== "string" ||
                typeof hospitalStr !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Missing doctor registration details"
                });
            }

            const transaction = await this.doctorService.registerDoctor(
                fullNameHashStr,
                licenseNumberHashStr,
                specializationStr,
                hospitalStr,
            );

            return res.status(201).json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        } catch (error: any) {

            console.error("Doctor Registration Error:", error);

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
    GET /api/doctors/:wallet
    ==========================================================
    */
    async getDoctor(req: Request, res: Response) {

        try {

            const walletParam = req.params.wallet as unknown as string | string[] | undefined;
            const wallet = Array.isArray(walletParam) ? walletParam[0] : walletParam;
            if (!wallet || typeof wallet !== "string") {
                return res.status(400).json({ success: false, message: "wallet param is required" });
            }

            const doctor = await this.doctorService.getDoctor(wallet);

            return res.json({
                success: true,
                doctor: serializeBigInt(doctor)
            });

        } catch (error: any) {

            console.error("Get Doctor Error:", error);

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
    GET /api/doctors/active/:wallet
    ==========================================================
    */
    async isDoctorActive(req: Request, res: Response) {

        try {

            const walletParam2 = req.params.wallet as unknown as string | string[] | undefined;
            const wallet2 = Array.isArray(walletParam2) ? walletParam2[0] : walletParam2;
            if (!wallet2 || typeof wallet2 !== "string") {
                return res.status(400).json({ success: false, message: "wallet param is required" });
            }

            const active = await this.doctorService.isDoctorActive(wallet2);

            return res.json({
                success: true,
                active
            });

        } catch (error: any) {

            console.error("Doctor Active Check Error:", error);

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
    GET /api/doctors/verified/:wallet
    ==========================================================
    */
    async isDoctorVerified(req: Request, res: Response) {

        try {

            const walletParam3 = req.params.wallet as unknown as string | string[] | undefined;
            const wallet3 = Array.isArray(walletParam3) ? walletParam3[0] : walletParam3;
            if (!wallet3 || typeof wallet3 !== "string") {
                return res.status(400).json({ success: false, message: "wallet param is required" });
            }

            const verified = await this.doctorService.isDoctorVerified(wallet3);

            return res.json({
                success: true,
                verified
            });

        } catch (error: any) {

            console.error("Doctor Verification Check Error:", error);

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
    GET /api/doctors/hospital/:wallet
    ==========================================================
    */
    async getDoctorHospital(req: Request, res: Response) {

        try {

            const walletParam4 = req.params.wallet as unknown as string | string[] | undefined;
            const wallet4 = Array.isArray(walletParam4) ? walletParam4[0] : walletParam4;
            if (!wallet4 || typeof wallet4 !== "string") {
                return res.status(400).json({ success: false, message: "wallet param is required" });
            }

            const hospital = await this.doctorService.getDoctorHospital(wallet4);

            return res.json({
                success: true,
                hospital
            });

        } catch (error: any) {

            console.error("Get Doctor Hospital Error:", error);

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
    POST /api/doctors/verify
    Admin only on-chain.
    ==========================================================
    */
    async verifyDoctor(req: Request, res: Response) {

        try {

            const { wallet } = req.body as { [key: string]: any };
            const walletStr = Array.isArray(wallet) ? wallet[0] : wallet;

            if (!walletStr || typeof walletStr !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Wallet address is required",
                });
            }

            const transaction = await this.doctorService.verifyDoctor(walletStr);

            const verified = await this.doctorService.isDoctorVerified(walletStr);

            return res.json({
                success: true,
                wallet: walletStr,
                verified,
                transaction: serializeBigInt(transaction),
            });

        } catch (error: any) {

            console.error("Doctor Verification Error:", error);

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
    POST /api/doctors/revoke-verification
    Admin only on-chain.
    ==========================================================
    */
    async revokeVerification(req: Request, res: Response) {

        try {

            const { wallet } = req.body as { [key: string]: any };
            const walletStr = Array.isArray(wallet) ? wallet[0] : wallet;

            if (!walletStr || typeof walletStr !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Wallet address is required",
                });
            }

            const transaction = await this.doctorService.revokeVerification(walletStr);

            const verified = await this.doctorService.isDoctorVerified(walletStr);

            return res.json({
                success: true,
                wallet: walletStr,
                verified,
                transaction: serializeBigInt(transaction),
            });

        } catch (error: any) {

            console.error("Doctor Revoke Verification Error:", error);

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
    POST /api/doctors/deactivate
    Acts on msg.sender (the backend's own PRIVATE_KEY wallet) —
    same single-wallet caveat as Patient's deactivate endpoint.
    ==========================================================
    */
    async deactivateDoctor(req: Request, res: Response) {

        try {

            const transaction =
                await this.doctorService.deactivateDoctor();

            return res.json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        } catch (error: any) {

            console.error("Doctor Deactivation Error:", error);

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
    POST /api/doctors/reactivate
    Admin only on-chain.
    ==========================================================
    */
    async reactivateDoctor(req: Request, res: Response) {

        try {

            const { wallet } = req.body as { [key: string]: any };
            const walletStr = Array.isArray(wallet) ? wallet[0] : wallet;

            if (!walletStr || typeof walletStr !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Wallet address is required",
                });
            }

            const transaction = await this.doctorService.reactivateDoctor(walletStr);

            return res.json({
                success: true,
                wallet: walletStr,
                transaction: serializeBigInt(transaction),
            });

        } catch (error: any) {

            console.error("Doctor Reactivation Error:", error);

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
    POST /api/doctors/update-specialization
    Acts on msg.sender — same single-wallet caveat.
    ==========================================================
    */
    async updateSpecialization(req: Request, res: Response) {

        try {


            const { specialization } = req.body as { [key: string]: any };
            const specializationStr = Array.isArray(specialization) ? specialization[0] : specialization;

            if (!specializationStr || typeof specializationStr !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "specialization is required",
                });
            }

            const transaction = await this.doctorService.updateSpecialization(specializationStr);

            return res.json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        } catch (error: any) {

            console.error("Doctor Update Specialization Error:", error);

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
    GET /api/doctors/total
    ==========================================================
    */
    async totalDoctors(req: Request, res: Response) {

        try {

            const total =
                await this.doctorService.totalDoctors();

            return res.json({
                success: true,
                total: serializeBigInt(total)
            });

        } catch (error: any) {

            console.error("Total Doctors Error:", error);

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