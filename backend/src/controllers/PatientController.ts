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

            const receipt =
                await this.patientService.registerPatient(

                    fullNameHash,

                    dobHash,

                    bloodGroup,

                    gender

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

    async getPatient(

        req: Request,

        res: Response

    ) {

        try {

            const patient =
                await this.patientService.getPatient(
                    req.params.wallet
                );

            const response = {
                patientId: patient.patientId.toString(),
                wallet: patient.wallet,
                fullNameHash: patient.fullNameHash,
                dobHash: patient.dobHash,
                bloodGroup: patient.bloodGroup,
                gender: patient.gender,
                recordCount: patient.recordCount.toString(),
                createdAt: patient.createdAt.toString(),
                updatedAt: patient.updatedAt.toString(),
                active: patient.active
            };

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

}