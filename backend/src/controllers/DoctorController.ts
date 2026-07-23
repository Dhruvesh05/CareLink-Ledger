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
                hospital
            } = req.body;

            if (
                !fullNameHash ||
                !licenseNumberHash ||
                !specialization ||
                !hospital
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Missing doctor registration details"
                });
            }

            const transaction =
                await this.doctorService.registerDoctor(
                    fullNameHash,
                    licenseNumberHash,
                    specialization,
                    hospital
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

            const doctor =
                await this.doctorService.getDoctor(
                    req.params.wallet
                );

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

            const active =
                await this.doctorService.isDoctorActive(
                    req.params.wallet
                );

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

            const verified =
                await this.doctorService.isDoctorVerified(
                    req.params.wallet
                );

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

            const hospital =
                await this.doctorService.getDoctorHospital(
                    req.params.wallet
                );

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

            const { wallet } = req.body;

            if (!wallet) {
                return res.status(400).json({
                    success: false,
                    message: "Wallet address is required"
                });
            }

            const transaction =
                await this.doctorService.verifyDoctor(wallet);

            const verified =
                await this.doctorService.isDoctorVerified(wallet);

            return res.json({
                success: true,
                wallet,
                verified,
                transaction: serializeBigInt(transaction)
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

            const { wallet } = req.body;

            if (!wallet) {
                return res.status(400).json({
                    success: false,
                    message: "Wallet address is required"
                });
            }

            const transaction =
                await this.doctorService.revokeVerification(wallet);

            const verified =
                await this.doctorService.isDoctorVerified(wallet);

            return res.json({
                success: true,
                wallet,
                verified,
                transaction: serializeBigInt(transaction)
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

            const { wallet } = req.body;

            if (!wallet) {
                return res.status(400).json({
                    success: false,
                    message: "Wallet address is required"
                });
            }

            const transaction =
                await this.doctorService.reactivateDoctor(wallet);

            return res.json({
                success: true,
                wallet,
                transaction: serializeBigInt(transaction)
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

            const { specialization } = req.body;

            if (!specialization) {
                return res.status(400).json({
                    success: false,
                    message: "specialization is required"
                });
            }

            const transaction =
                await this.doctorService.updateSpecialization(specialization);

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