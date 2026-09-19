import { MedicalRecordContract } from "../contracts/MedicalRecordContract";

export class PolygonMedicalRecordService {

    private readonly medicalRecordContract =
        new MedicalRecordContract();

    async createMedicalRecord(
        patient: string,
        ipfsHash: string,
        fileHash: string,
        category: string,
        emergency: boolean
    ) {
        return await this.medicalRecordContract.createMedicalRecord(
            patient,
            ipfsHash,
            fileHash,
            category,
            emergency
        );
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
        return await this.medicalRecordContract.createMedicalRecordFromBridge(
            messageId,
            sourceChain,
            sourceRecordId,
            patient,
            doctor,
            hospital,
            ipfsHash,
            fileHash,
            category,
            emergency
        );
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
        return await this.medicalRecordContract.updateMedicalRecordFromBridge(
            messageId,
            sourceChain,
            sourceRecordId,
            newIpfsHash,
            newFileHash,
            newCategory,
            expectedVersion
        );
    }

    async deactivateMedicalRecordFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        actor: string
    ) {
        return await this.medicalRecordContract.deactivateMedicalRecordFromBridge(
            messageId,
            sourceChain,
            sourceRecordId,
            actor
        );
    }

    async grantAccessFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        doctor: string
    ) {
        return await this.medicalRecordContract.grantAccessFromBridge(
            messageId,
            sourceChain,
            sourceRecordId,
            doctor
        );
    }

    async revokeAccessFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        doctor: string
    ) {
        return await this.medicalRecordContract.revokeAccessFromBridge(
            messageId,
            sourceChain,
            sourceRecordId,
            doctor
        );
    }

    async updateMedicalRecord(
        recordId: number,
        ipfsHash: string,
        fileHash: string,
        category: string,
        expectedVersion: number
    ) {
        return await this.medicalRecordContract.updateMedicalRecord(
            recordId,
            ipfsHash,
            fileHash,
            category,
            expectedVersion
        );
    }

    async deactivateMedicalRecord(recordId: number) {
        return await this.medicalRecordContract.deactivateMedicalRecord(
            recordId
        );
    }

    async grantAccess(recordId: number, doctor: string) {
        return await this.medicalRecordContract.grantAccess(
            recordId,
            doctor
        );
    }

    async revokeAccess(recordId: number, doctor: string) {
        return await this.medicalRecordContract.revokeAccess(
            recordId,
            doctor
        );
    }

    async isAuthorizedDoctor(
        recordId: number,
        doctor: string
    ) {
        return await this.medicalRecordContract.isAuthorizedDoctor(
            recordId,
            doctor
        );
    }

    async viewRecord(recordId: number) {
        return await this.medicalRecordContract.viewRecord(
            recordId
        );
    }

    async logDownload(recordId: number) {
        return await this.medicalRecordContract.logDownload(
            recordId
        );
    }

    async getMedicalRecord(
        recordId: number,
        caller?: string
    ) {
        return await this.medicalRecordContract
            .getMedicalRecord(
                recordId,
                caller
            );
    }

    async getPatientRecords(
        patient: string,
        caller?: string
    ) {
        return await this.medicalRecordContract
            .getPatientRecords(
                patient,
                caller
            );
    }

    async getDoctorRecords(
        doctor: string,
        caller?: string
    ) {
        return await this.medicalRecordContract
            .getDoctorRecords(
                doctor,
                caller
            );
    }

    async getHospitalRecords(
        hospital: string,
        caller?: string
    ) {
        return await this.medicalRecordContract
            .getHospitalRecords(
                hospital,
                caller
            );
    }

    async recordExists(recordId: number) {
        return await this.medicalRecordContract.recordExists(
            recordId
        );
    }

    async totalRecords() {
        return await this.medicalRecordContract.totalRecords();
    }
}
