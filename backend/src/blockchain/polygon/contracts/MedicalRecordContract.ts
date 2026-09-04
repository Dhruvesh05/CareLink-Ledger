import { ethers } from "ethers";

import { polygon } from "../config/polygon";
import MedicalRecordABI from "../abi/MedicalRecord.json";

const medicalRecordInterface =
    new ethers.Interface(MedicalRecordABI.abi);

export class MedicalRecordContract {

    private readonly contract =
        polygon.medicalRecord;

    private extractRecordCreatedId(
        receipt: ethers.TransactionReceipt
    ): number | null {

        if (!receipt?.logs) {
            return null;
        }

        for (const log of receipt.logs) {

            try {

                const parsedLog =
                    medicalRecordInterface.parseLog(
                        log as any
                    );

                if (
                    parsedLog?.name ===
                    "RecordCreated"
                ) {

                    const recordId =
                        parsedLog.args[0];

                    const numericRecordId =
                        Number(recordId);

                    if (
                        Number.isSafeInteger(
                            numericRecordId
                        ) &&
                        numericRecordId > 0
                    ) {

                        return numericRecordId;
                    }

                    return null;
                }

            } catch {
                // Ignore unrelated logs.
            }
        }

        return null;
    }

    async createMedicalRecord(
        patient: string,
        ipfsHash: string,
        fileHash: string,
        category: string,
        emergency: boolean
    ) {

        const tx =
            await this.contract.createMedicalRecord(
                patient,
                ipfsHash,
                fileHash,
                category,
                emergency
            );

        const receipt =
            await tx.wait();

        if (!receipt) {

            throw new Error(
                "No transaction receipt returned for medical record creation"
            );
        }

        const recordId =
            this.extractRecordCreatedId(
                receipt
            );

        if (recordId === null) {

            throw new Error(
                "Unable to determine the on-chain recordId from the createMedicalRecord transaction receipt"
            );
        }

        return {
            ...receipt,
            hash: receipt.hash,
            transactionHash: receipt.hash,
            recordId
        };
    }

    async updateMedicalRecord(
        recordId: number,
        ipfsHash: string,
        fileHash: string,
        category: string,
        expectedVersion: number
    ) {

        const tx =
            await this.contract.updateMedicalRecord(
                recordId,
                ipfsHash,
                fileHash,
                category,
                expectedVersion
            );

        return await tx.wait();
    }

    async deactivateMedicalRecord(
        recordId: number
    ) {

        const tx =
            await this.contract.deactivateMedicalRecord(
                recordId
            );

        return await tx.wait();
    }

    async grantAccess(
        recordId: number,
        doctor: string
    ) {

        const tx =
            await this.contract.grantAccess(
                recordId,
                doctor
            );

        return await tx.wait();
    }

    async revokeAccess(
        recordId: number,
        doctor: string
    ) {

        const tx =
            await this.contract.revokeAccess(
                recordId,
                doctor
            );

        return await tx.wait();
    }

    async isAuthorizedDoctor(
        recordId: number,
        doctor: string
    ) {

        return await this.contract
            .isAuthorizedDoctor(
                recordId,
                doctor
            );
    }

    async viewRecord(
        recordId: number
    ) {

        return await this.contract
            .viewRecord(recordId);
    }

    async logDownload(
        recordId: number
    ) {

        const tx =
            await this.contract.logDownload(
                recordId
            );

        return await tx.wait();
    }

    async getMedicalRecord(
        recordId: number
    ) {

        return await this.contract
            .getMedicalRecord(recordId);
    }

    async getPatientRecords(
        patient: string
    ) {

        return await this.contract
            .getPatientRecords(patient);
    }

    async getDoctorRecords(
        doctor: string
    ) {

        return await this.contract
            .getDoctorRecords(doctor);
    }

    async getHospitalRecords(
        hospital: string
    ) {

        return await this.contract
            .getHospitalRecords(hospital);
    }

    async recordExists(
        recordId: number
    ) {

        return await this.contract
            .recordExists(recordId);
    }

    async totalRecords() {

        return await this.contract
            .totalRecords();
    }
}