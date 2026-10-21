import {
    getAddress,
    isAddress,
    verifyMessage,
} from "ethers";

import PatientIdentityMappingModel from "../models/PatientIdentityMappingModel";
import UserModel from "../models/User";

export interface CreatePatientIdentityMappingInput {
    hospitalWallet: string;
    sourcePatientId: string;
    fhirPatientId: string;
    patientWallet: string;
    patientSignature: string;
}

export class PatientIdentityMappingService {
    async createMapping(
        input: CreatePatientIdentityMappingInput,
    ): Promise<any> {
        const hospitalWallet = this.normalizeWallet(
            input.hospitalWallet,
            "hospitalWallet",
        );

        const patientWallet = this.normalizeWallet(
            input.patientWallet,
            "patientWallet",
        );

        const sourcePatientId = this.requireIdentifier(
            input.sourcePatientId,
            "sourcePatientId",
        );

        const fhirPatientId = this.requireIdentifier(
            input.fhirPatientId,
            "fhirPatientId",
        );

        const verificationMessage = JSON.stringify({
            purpose: "CareLink Ledger patient identity mapping",
            version: "1",
            hospitalWallet: hospitalWallet.toLowerCase(),
            sourcePatientId,
            fhirPatientId,
            patientWallet: patientWallet.toLowerCase(),
        });

        if (
            typeof input.patientSignature !== "string" ||
            !input.patientSignature.trim()
        ) {
            throw new Error("Patient wallet signature is required");
        }

        let signer: string;

        try {
            signer = verifyMessage(
                verificationMessage,
                input.patientSignature,
            );
        } catch {
            throw new Error(
                "Invalid patient identity verification signature",
            );
        }

        if (signer.toLowerCase() !== patientWallet.toLowerCase()) {
            throw new Error(
                "Patient signature does not match the registered patient wallet",
            );
        }

        const hospital = await UserModel.findOne({
            walletAddress: hospitalWallet.toLowerCase(),
            role: "Hospital",
            active: true,
        });

        if (!hospital) {
            throw new Error(
                "An active CareLink Hospital account is required",
            );
        }

        const patient = await UserModel.findOne({
            walletAddress: patientWallet.toLowerCase(),
            role: "Patient",
            active: true,
        });

        if (!patient) {
            throw new Error(
                "An active CareLink Patient account is required",
            );
        }

        try {
            return await PatientIdentityMappingModel.create({
                hospitalWallet: hospitalWallet.toLowerCase(),
                sourcePatientId,
                fhirPatientId,
                patientWallet: patientWallet.toLowerCase(),
                verifiedByWallet: hospitalWallet.toLowerCase(),
                verifiedAt: new Date(),
                active: true,
            });
        } catch (error: unknown) {
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === 11000
            ) {
                throw new Error(
                    "A mapping already exists for this hospital patient identity",
                );
            }

            throw error;
        }
    }

    async resolvePatientWallet(
        hospitalWalletInput: string,
        sourcePatientIdInput: string,
        fhirPatientIdInput: string,
    ): Promise<string> {
        const hospitalWallet = this.normalizeWallet(
            hospitalWalletInput,
            "hospitalWallet",
        );

        const sourcePatientId = this.requireIdentifier(
            sourcePatientIdInput,
            "sourcePatientId",
        );

        const fhirPatientId = this.requireIdentifier(
            fhirPatientIdInput,
            "fhirPatientId",
        );

        const mapping = await PatientIdentityMappingModel.findOne({
            hospitalWallet: hospitalWallet.toLowerCase(),
            sourcePatientId,
            fhirPatientId,
            active: true,
        });

        if (!mapping) {
            throw new Error(
                "No active patient identity mapping exists for this FHIR patient",
            );
        }

        const patient = await UserModel.findOne({
            walletAddress: mapping.patientWallet.toLowerCase(),
            role: "Patient",
            active: true,
        });

        if (!patient) {
            throw new Error(
                "The mapped CareLink Patient account is missing or inactive",
            );
        }

        return getAddress(patient.walletAddress);
    }

    private normalizeWallet(
        value: string,
        field: string,
    ): string {
        if (
            typeof value !== "string" ||
            !isAddress(value.trim())
        ) {
            throw new Error(`Invalid ${field}`);
        }

        return getAddress(value.trim());
    }

    private requireIdentifier(
        value: string,
        field: string,
    ): string {
        if (
            typeof value !== "string" ||
            !value.trim()
        ) {
            throw new Error(`${field} is required`);
        }

        return value.trim();
    }
}