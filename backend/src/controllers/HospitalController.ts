import { Request, Response } from "express";

import { HospitalService } from "../services/HospitalService";
import { serializeBigInt } from "../utils/bigint";

export class HospitalController {

    private hospitalService: HospitalService;

    constructor() {
        this.hospitalService = new HospitalService();
    }

    /**
     * Register Hospital
     */
    async registerHospital(req: Request, res: Response) {

        try {

            const {
                hospitalNameHash,
                registrationNumberHash,
                locationHash
            } = req.body;

            if (
                !hospitalNameHash ||
                !registrationNumberHash ||
                !locationHash
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Missing hospital registration details"
                });
            }

            const transaction =
                await this.hospitalService.registerHospital(
                    hospitalNameHash,
                    registrationNumberHash,
                    locationHash
                );

            return res.status(201).json({
                success: true,
                transaction
            });

        } catch (error: any) {

            console.error("Hospital Registration Error:", error);

            return res.status(500).json({
                success: false,
                message: error.message,
                reason: error.reason,
                code: error.code,
                shortMessage: error.shortMessage
            });

        }

    }

    /**
     * Get Hospital Details
     */
    async getHospital(req: Request, res: Response) {

        try {

            const hospital =
                await this.hospitalService.getHospital(
                    req.params.wallet
                );

            return res.json({
                success: true,
                hospital: serializeBigInt(hospital)
            });

        } catch (error: any) {

            console.error("Get Hospital Error:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });

        }

    }

    /**
     * Check Hospital Active Status
     */
    async isHospitalActive(req: Request, res: Response) {

        try {

            const active =
                await this.hospitalService.isHospitalActive(
                    req.params.wallet
                );

            return res.json({
                success: true,
                active
            });

        } catch (error: any) {

            console.error("Hospital Active Check Error:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });

        }

    }

    /**
     * GET /api/hospitals/verified/:wallet
     */
    async isHospitalVerified(req: Request, res: Response) {

        try {

            const verified =
                await this.hospitalService.isHospitalVerified(
                    req.params.wallet
                );

            return res.json({
                success: true,
                verified
            });

        } catch (error: any) {

            console.error("Hospital Verification Error:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });

        }

    }

    /**
     * POST /api/hospitals/verify
     *
     * Actually submits the on-chain verifyHospital() transaction.
     * Previously this only re-read isHospitalVerified() and never called
     * verifyHospital() itself, so a hospital could never be moved from
     * unverified to verified through this endpoint.
     */
    async verifyHospital(req: Request, res: Response) {

        try {

            const { wallet } = req.body;

            if (!wallet) {
                return res.status(400).json({
                    success: false,
                    message: "Wallet address is required"
                });
            }

            const transaction =
                await this.hospitalService.verifyHospital(wallet);

            const verified =
                await this.hospitalService.isHospitalVerified(wallet);

            return res.json({
                success: true,
                wallet,
                verified,
                transaction: serializeBigInt(transaction)
            });

        } catch (error: any) {

            console.error("Hospital Verification Error:", error);

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