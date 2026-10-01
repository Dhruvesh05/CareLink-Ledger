import { ethers } from "ethers";

import { polygon } from "../config/polygon";
import MedicalRecordABI from "../abi/MedicalRecord.json";

const medicalRecordInterface =
    new ethers.Interface(MedicalRecordABI.abi);

export class MedicalRecordContract {

    private readonly contract =
        polygon.medicalRecord;

    private readonly readContract =
        polygon.medicalRecord.connect(
            polygon.provider
        );

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

    async createMedicalRecordFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        patient: string,
        doctor: string,
        hospital: string,
        ipfsHash: string,
        fileHash: string,
        category: string,
        emergency: boolean
    ) {
        const encodedMessageId = ethers.id(messageId);
        const encodedSourceChain = ethers.encodeBytes32String(sourceChain);

        const tx =
            await this.contract.createMedicalRecordFromBridge(
                encodedMessageId,
                encodedSourceChain,
                sourceRecordId,
                patient,
                doctor,
                hospital,
                ipfsHash,
                fileHash,
                category,
                emergency
            );

        return await tx.wait();
    }

    async updateMedicalRecordFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        newIpfsHash: string,
        newFileHash: string,
        newCategory: string,
        expectedVersion: number
    ) {
        const tx =
            await this.contract.updateMedicalRecordFromBridge(
                messageId,
                sourceChain,
                sourceRecordId,
                newIpfsHash,
                newFileHash,
                newCategory,
                expectedVersion
            );

        return await tx.wait();
    }

    async deactivateMedicalRecordFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        actor: string
    ) {
        const tx =
            await this.contract.deactivateMedicalRecordFromBridge(
                messageId,
                sourceChain,
                sourceRecordId,
                actor
            );

        return await tx.wait();
    }

    async grantAccessFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        doctor: string
    ) {
        const tx =
            await this.contract.grantAccessFromBridge(
                messageId,
                sourceChain,
                sourceRecordId,
                doctor
            );

        return await tx.wait();
    }

    async revokeAccessFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        doctor: string
    ) {
        const tx =
            await this.contract.revokeAccessFromBridge(
                messageId,
                sourceChain,
                sourceRecordId,
                doctor
            );

        return await tx.wait();
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
        recordId: number,
        caller?: string
    ) {

        if (caller) {
            return await this.readContract
                .getFunction("getMedicalRecord")
                .staticCall(
                    recordId,
                    { from: caller }
                );
        }

        return await this.contract
            .getMedicalRecord(recordId);
    }

    async getPatientRecords(
        patient: string,
        caller?: string
    ) {

        if (caller) {
            return await this.readContract
                .getFunction("getPatientRecords")
                .staticCall(
                    patient,
                    { from: caller }
                );
        }

        return await this.contract
            .getPatientRecords(patient);
    }

    async getDoctorRecords(
        doctor: string,
        caller?: string
    ) {

        if (caller) {
            return await this.readContract
                .getFunction("getDoctorRecords")
                .staticCall(
                    doctor,
                    { from: caller }
                );
        }

        return await this.contract
            .getDoctorRecords(doctor);
    }

    async getHospitalRecords(
        hospital: string,
        caller?: string
    ) {

        if (caller) {
            return await this.readContract
                .getFunction("getHospitalRecords")
                .staticCall(
                    hospital,
                    { from: caller }
                );
        }

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