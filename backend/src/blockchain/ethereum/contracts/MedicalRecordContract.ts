import { ethers } from "ethers";

import { ethereum } from "../config/ethereum";
import MedicalRecordABI from "../abi/MedicalRecord.json";

const medicalRecordInterface = new ethers.Interface(MedicalRecordABI.abi);

export class MedicalRecordContract {

    private extractRecordCreatedId(receipt: ethers.TransactionReceipt): number | null {

        if (!receipt?.logs) {
            return null;
        }

        for (const log of receipt.logs) {
            try {
                const parsedLog = medicalRecordInterface.parseLog(log as any);

                if (parsedLog?.name === "RecordCreated") {
                    const recordId = parsedLog.args[0];
                    const numericRecordId = Number(recordId);

                    if (Number.isSafeInteger(numericRecordId) && numericRecordId > 0) {
                        return numericRecordId;
                    }

                    return null;
                }
            }
            catch {
                // Ignore unrelated logs.
            }
        }

        return null;

    }


    /*
    ==========================================================
    RECORD LIFECYCLE
    ==========================================================
    */

    async createMedicalRecord(
        patient: string,
        ipfsHash: string,
        fileHash: string,
        category: string,
        emergency: boolean
    ) {


        const tx =
            await ethereum.medicalRecord.createMedicalRecord(
                patient,
                ipfsHash,
                fileHash,
                category,
                emergency
            );

        const receipt = await tx.wait();

        if (!receipt) {
            throw new Error("No transaction receipt returned for medical record creation");
        }

        const recordId = this.extractRecordCreatedId(receipt);

        if (recordId === null) {
            throw new Error("Unable to determine the on-chain recordId from the createMedicalRecord transaction receipt");
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
        newIpfsHash: string,
        newFileHash: string,
        newCategory: string,
        expectedVersion: number
    ) {


        const tx =
            await ethereum.medicalRecord.updateMedicalRecord(
                recordId,
                newIpfsHash,
                newFileHash,
                newCategory,
                expectedVersion
            );


        return await tx.wait();

    }





    async deactivateMedicalRecord(
        recordId: number
    ) {


        const tx =
            await ethereum.medicalRecord.deactivateMedicalRecord(
                recordId
            );


        return await tx.wait();

    }




    /*
    ==========================================================
    ACCESS DELEGATION
    ==========================================================
    */

    async grantAccess(
        recordId: number,
        doctor: string
    ) {


        const tx =
            await ethereum.medicalRecord.grantAccess(
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
            await ethereum.medicalRecord.revokeAccess(
                recordId,
                doctor
            );


        return await tx.wait();

    }





    async isAuthorizedDoctor(
        recordId: number,
        doctor: string
    ) {


        return await ethereum.medicalRecord.isAuthorizedDoctor(
            recordId,
            doctor
        );

    }




    /*
    ==========================================================
    READ ACCESS (AUDIT-LOGGING VARIANTS)
    ==========================================================
    viewRecord() and logDownload() are NOT view functions on-chain —
    each also writes an AuditLog entry, so both require a real
    transaction. A sent transaction's Solidity return value cannot be
    read back from its receipt, so after the transaction is mined we
    re-read the record via the free getMedicalRecord() call to hand
    the caller the current on-chain state. This mirrors the pattern
    already used in the legacy EthereumProvider.viewRecord().
    */

    async viewRecord(
        recordId: number
    ) {


        const tx =
            await ethereum.medicalRecord.viewRecord(
                recordId
            );


        await tx.wait();


        return await this.getMedicalRecord(recordId);

    }





    async logDownload(
        recordId: number
    ) {


        const tx =
            await ethereum.medicalRecord.logDownload(
                recordId
            );


        await tx.wait();


        return await this.getMedicalRecord(recordId);

    }




    /*
    ==========================================================
    READ ACCESS (FREE VIEW CALLS)
    ==========================================================
    */

    async getMedicalRecord(
        recordId: number
    ) {


        return await ethereum.medicalRecord.getMedicalRecord(
            recordId
        );

    }





    async getPatientRecords(
        patient: string
    ) {


        return await ethereum.medicalRecord.getPatientRecords(
            patient
        );

    }





    async getDoctorRecords(
        doctor: string
    ) {


        return await ethereum.medicalRecord.getDoctorRecords(
            doctor
        );

    }





    async getHospitalRecords(
        hospital: string
    ) {


        return await ethereum.medicalRecord.getHospitalRecords(
            hospital
        );

    }





    async recordExists(
        recordId: number
    ) {


        return await ethereum.medicalRecord.recordExists(
            recordId
        );

    }





    async totalRecords() {


        return await ethereum.medicalRecord.totalRecords();

    }



}