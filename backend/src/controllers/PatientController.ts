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

                gender

            } = req.body;

            if (
                !fullNameHash ||
                !dobHash ||
                !bloodGroup ||
                !gender
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Missing patient registration details"
                });
            }

            const receipt =
                await this.patientService.registerPatient(

                    fullNameHash,

                    dobHash,

                    bloodGroup,

                    gender

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

            const patient =
                await this.patientService.getPatient(
                    req.params.wallet
                );

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

            const active =
                await this.patientService.isPatientActive(

                    req.params.wallet

                );

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

            const { bloodGroup } = req.body;

            if (!bloodGroup) {
                return res.status(400).json({
                    success: false,
                    message: "bloodGroup is required"
                });
            }

            const receipt =
                await this.patientService.updateBloodGroup(bloodGroup);

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

            const { wallet } = req.body;

            if (!wallet) {
                return res.status(400).json({
                    success: false,
                    message: "Wallet address is required"
                });
            }

            const receipt =
                await this.patientService.reactivatePatient(wallet);

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