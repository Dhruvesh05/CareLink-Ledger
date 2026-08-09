import { Request, Response } from "express";
import { ethers } from "ethers";

import { HospitalService } from "../services/HospitalService";
import { serializeBigInt } from "../utils/bigint";

/**
 * Maps a thrown blockchain/service error to an HTTP status code, using the
 * Solidity custom-error name (available on `error.reason` or embedded in
 * `error.shortMessage` / `error.message` depending on how ethers surfaces
 * the revert) where possible, falling back to 500 for anything unknown.
 *
 * NOT_FOUND_ERRORS / CONFLICT_ERRORS / FORBIDDEN_ERRORS are named after the
 * custom errors expected on HospitalRegistry.sol, following the same
 * naming convention already used in PatientRegistry.sol/DoctorRegistry.sol
 * (e.g. PatientNotFound/DoctorNotFound, PatientAlreadyExists, Unauthorized).
 * If your deployed contract uses different names, adjust these lists.
 */
const NOT_FOUND_ERRORS = [
    "HospitalNotFound"
];

const CONFLICT_ERRORS = [
    "HospitalAlreadyExists",
    "AlreadyVerified",
    "NotVerified",
    "HospitalAlreadyActive",
    "HospitalInactive"
];

const FORBIDDEN_ERRORS = [
    "Unauthorized"
];

const BAD_REQUEST_ERRORS = [
    "ZeroAddress",
    "EmptyField"
];

function resolveErrorName(error: any): string {
    return (
        error?.reason ||
        error?.shortMessage ||
        error?.message ||
        ""
    ).toString();

}

function statusForError(error: any): number {

    const errorText = resolveErrorName(error);

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

export class HospitalController {

    private hospitalService: HospitalService;

    constructor() {
        this.hospitalService = new HospitalService();
    }

    /**
     * POST /api/hospitals/register
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
                transaction: serializeBigInt(transaction)
            });

        } catch (error: any) {

            console.error("Hospital Registration Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /**
     * GET /api/hospitals/:wallet
     */
    async getHospital(req: Request, res: Response) {

        try {

            const walletParam = req.params.wallet as unknown as string | string[] | undefined;
            const wallet = Array.isArray(walletParam) ? walletParam[0] : walletParam;

            if (!wallet || !ethers.isAddress(wallet)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
                });
            }

            const hospital =
                await this.hospitalService.getHospital(wallet);

            return res.json({
                success: true,
                hospital: serializeBigInt(hospital)
            });

        } catch (error: any) {

            console.error("Get Hospital Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /**
     * GET /api/hospitals/active/:wallet
     */
    async isHospitalActive(req: Request, res: Response) {

        try {

            const walletParam = req.params.wallet as unknown as string | string[] | undefined;
            const wallet = Array.isArray(walletParam) ? walletParam[0] : walletParam;

            if (!wallet || !ethers.isAddress(wallet)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
                });
            }

            const active =
                await this.hospitalService.isHospitalActive(wallet);

            return res.json({
                success: true,
                active
            });

        } catch (error: any) {

            console.error("Hospital Active Check Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /**
     * GET /api/hospitals/verified/:wallet
     */
    async isHospitalVerified(req: Request, res: Response) {

        try {

            const walletParam = req.params.wallet as unknown as string | string[] | undefined;
            const wallet = Array.isArray(walletParam) ? walletParam[0] : walletParam;

            if (!wallet || !ethers.isAddress(wallet)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
                });
            }

            const verified =
                await this.hospitalService.isHospitalVerified(wallet);

            return res.json({
                success: true,
                verified
            });

        } catch (error: any) {

            console.error("Hospital Verification Check Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /**
     * POST /api/hospitals/verify
     * Admin only on-chain.
     */
    async verifyHospital(req: Request, res: Response) {

        try {

            const { wallet } = req.body as { [key: string]: any };
            const walletStr = Array.isArray(wallet) ? wallet[0] : wallet;

            if (!walletStr || !ethers.isAddress(walletStr)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
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

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /**
     * POST /api/hospitals/revoke
     * Admin only on-chain.
     */
    async revokeVerification(req: Request, res: Response) {

        try {

            const { wallet } = req.body as { [key: string]: any };
            const walletStr = Array.isArray(wallet) ? wallet[0] : wallet;

            if (!walletStr || !ethers.isAddress(walletStr)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
                });
            }

            const transaction =
                await this.hospitalService.revokeVerification(wallet);

            const verified =
                await this.hospitalService.isHospitalVerified(wallet);

            return res.json({
                success: true,
                wallet,
                verified,
                transaction: serializeBigInt(transaction)
            });

        } catch (error: any) {

            console.error("Hospital Revoke Verification Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /**
     * POST /api/hospitals/reactivate
     * Admin only on-chain.
     */
    async reactivateHospital(req: Request, res: Response) {

        try {

            const { wallet } = req.body as { [key: string]: any };
            const walletStr = Array.isArray(wallet) ? wallet[0] : wallet;

            if (!walletStr || !ethers.isAddress(walletStr)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid wallet address"
                });
            }

            const transaction =
                await this.hospitalService.reactivateHospital(wallet);

            const active =
                await this.hospitalService.isHospitalActive(wallet);

            return res.json({
                success: true,
                wallet,
                active,
                transaction: serializeBigInt(transaction)
            });

        } catch (error: any) {

            console.error("Hospital Reactivation Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /**
     * POST /api/hospitals/deactivate
     *
     * IMPORTANT: takes no wallet in the body. The contract's
     * deactivateHospital() always acts on msg.sender, so this deactivates
     * whichever hospital identity the backend's own PRIVATE_KEY wallet
     * holds — not an arbitrary hospital passed by the caller. Once wallet
     * authentication (JWT + wallet) is added, this should execute on
     * behalf of the authenticated user's wallet instead.
     */
    async deactivateHospital(req: Request, res: Response) {

        try {

            const transaction =
                await this.hospitalService.deactivateHospital();

            return res.json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        } catch (error: any) {

            console.error("Hospital Deactivation Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /**
     * PUT /api/hospitals/location
     *
     * Same single-wallet caveat as deactivateHospital(): updates the
     * location of the backend signer's own hospital identity.
     */
    async updateLocation(req: Request, res: Response) {

        try {

            const { locationHash } = req.body;

            if (!locationHash) {
                return res.status(400).json({
                    success: false,
                    message: "locationHash is required"
                });
            }

            const transaction =
                await this.hospitalService.updateLocation(locationHash);

            return res.json({
                success: true,
                transaction: serializeBigInt(transaction)
            });

        } catch (error: any) {

            console.error("Hospital Update Location Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

    /**
     * GET /api/hospitals/count
     */
    async totalHospitals(req: Request, res: Response) {

        try {

            const count =
                await this.hospitalService.totalHospitals();

            return res.json({
                success: true,
                count: serializeBigInt(count)
            });

        } catch (error: any) {

            console.error("Total Hospitals Error:", error);

            return res.status(statusForError(error)).json(errorResponse(error));

        }

    }

}