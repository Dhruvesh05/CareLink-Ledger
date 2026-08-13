import { Request, Response } from "express";
import { serializeBigInt } from "../utils/bigint";
import { PatientService } from "../services/PatientService";

export class PatientController {

    private patientService = new PatientService();

    async registerPatient(
        req: Request,
        res: Response
    ) {

        try {

            const {
                fullNameHash,
                dobHash,
                bloodGroup,
                gender,
            } = req.body as { [key: string]: any };

            const fullNameHashStr = Array.isArray(fullNameHash) ? fullNameHash[0] : fullNameHash;
            const dobHashStr = Array.isArray(dobHash) ? dobHash[0] : dobHash;
            const bloodGroupStr = Array.isArray(bloodGroup) ? bloodGroup[0] : bloodGroup;
            const genderStr = Array.isArray(gender) ? gender[0] : gender;

            if (
                !fullNameHashStr ||
                !dobHashStr ||
                !bloodGroupStr ||
                !genderStr ||
                typeof fullNameHashStr !== "string" ||
                typeof dobHashStr !== "string" ||
                typeof bloodGroupStr !== "string" ||
                typeof genderStr !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Missing patient registration details"
                });
            }

            const receipt = await this.patientService.registerPatient(
                fullNameHashStr,
                dobHashStr,
                bloodGroupStr,
                genderStr,
            );

            return res.status(201).json({

                success: true,

                transaction: serializeBigInt(receipt)

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

    async getPatient(

        req: Request,

        res: Response

    ) {

        try {

            const walletParam = req.params.wallet as unknown as string | string[] | undefined;
            const wallet = Array.isArray(walletParam) ? walletParam[0] : walletParam;
            if (!wallet || typeof wallet !== "string") {
                return res.status(400).json({ success: false, message: "wallet param is required" });
            }

            const patient = await this.patientService.getPatient(wallet);

            return res.json({
                success: true,
                patient: serializeBigInt(patient)
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

    async isPatientActive(

        req: Request,

        res: Response

    ) {

        try {

            const walletParam2 = req.params.wallet as unknown as string | string[] | undefined;
            const wallet2 = Array.isArray(walletParam2) ? walletParam2[0] : walletParam2;
            if (!wallet2 || typeof wallet2 !== "string") {
                return res.status(400).json({ success: false, message: "wallet param is required" });
            }

            const active = await this.patientService.isPatientActive(wallet2);

            return res.json({

                success: true,

                active

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

    /**
     * POST /api/patients/update-blood-group
     *
     * Same single-wallet caveat as deactivatePatient(): the contract's
     * updateBloodGroup() always acts on msg.sender, so this only updates
     * the backend's own PRIVATE_KEY wallet's patient profile until wallet
     * ownership moves client-side.
     */
    async updateBloodGroup(

        req: Request,

        res: Response

    ) {

        try {

            const { bloodGroup } = req.body as { [key: string]: any };
            const bloodGroupStr = Array.isArray(bloodGroup) ? bloodGroup[0] : bloodGroup;

            if (!bloodGroupStr || typeof bloodGroupStr !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "bloodGroup is required"
                });
            }

            const receipt = await this.patientService.updateBloodGroup(bloodGroupStr);

            return res.json({

                success: true,

                transaction: serializeBigInt(receipt)

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

    /**
     * POST /api/patients/deactivate
     *
     * Deactivates the caller's own patient profile. Note: the contract's
     * deactivatePatient() takes no address argument — it always acts on
     * msg.sender. Since this backend signs every transaction with a single
     * wallet (from PRIVATE_KEY in .env), this endpoint only works as
     * intended if that backend wallet IS the patient's own wallet. If
     * patients are expected to hold their own keys, this call needs to be
     * signed client-side instead of proxied through this backend wallet.
     */
    async deactivatePatient(

        req: Request,

        res: Response

    ) {

        try {

            const receipt =
                await this.patientService.deactivatePatient();

            return res.json({

                success: true,

                transaction: serializeBigInt(receipt)

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

    /**
     * POST /api/patients/reactivate
     *
     * Admin-only on-chain (reactivatePatient reverts with Unauthorized()
     * unless AccessControl.isAdmin(msg.sender) is true).
     */
    async reactivatePatient(

        req: Request,

        res: Response

    ) {

        try {

            const { wallet } = req.body as { [key: string]: any };
            const walletStr = Array.isArray(wallet) ? wallet[0] : wallet;

            if (!walletStr || typeof walletStr !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Wallet address is required"
                });
            }

            const receipt = await this.patientService.reactivatePatient(walletStr);

            return res.json({

                success: true,

                wallet,

                transaction: serializeBigInt(receipt)

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