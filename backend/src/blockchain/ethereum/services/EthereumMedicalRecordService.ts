import {
    MedicalRecordContract
} from "../contracts/MedicalRecordContract";

export class EthereumMedicalRecordService {

    private readonly medicalRecordContract:
        MedicalRecordContract;

    constructor() {

        this.medicalRecordContract =
            new MedicalRecordContract();
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

        return this.medicalRecordContract
            .createMedicalRecord(
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

        return this.medicalRecordContract
            .createMedicalRecordFromBridge(
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

        return this.medicalRecordContract
            .updateMedicalRecordFromBridge(
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

        return this.medicalRecordContract
            .deactivateMedicalRecordFromBridge(
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

        return this.medicalRecordContract
            .grantAccessFromBridge(
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

        return this.medicalRecordContract
            .revokeAccessFromBridge(
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

        return this.medicalRecordContract
            .updateMedicalRecord(
                recordId,
                ipfsHash,
                fileHash,
                category,
                expectedVersion
            );
    }

    async deactivateMedicalRecord(
        recordId: number
    ) {

        return this.medicalRecordContract
            .deactivateMedicalRecord(
                recordId
            );
    }

    /*
    ==========================================================
    ACCESS CONTROL
    ==========================================================
    */

    async grantAccess(
        recordId: number,
        doctor: string
    ) {

        return this.medicalRecordContract
            .grantAccess(
                recordId,
                doctor
            );
    }

    async revokeAccess(
        recordId: number,
        doctor: string
    ) {

        return this.medicalRecordContract
            .revokeAccess(
                recordId,
                doctor
            );
    }

    async isAuthorizedDoctor(
        recordId: number,
        doctor: string
    ) {

        return this.medicalRecordContract
            .isAuthorizedDoctor(
                recordId,
                doctor
            );
    }

    /*
    ==========================================================
    AUDIT
    ==========================================================
    */

    async viewRecord(
        recordId: number
    ) {

        return this.medicalRecordContract
            .viewRecord(recordId);
    }

    async logDownload(
        recordId: number
    ) {

        return this.medicalRecordContract
            .logDownload(recordId);
    }

    /*
    ==========================================================
    READ
    ==========================================================
    */

    async getMedicalRecord(
        recordId: number
    ) {

        return this.medicalRecordContract
            .getMedicalRecord(recordId);
    }

    async getPatientRecords(
        patient: string
    ) {

        return this.medicalRecordContract
            .getPatientRecords(patient);
    }

    async getDoctorRecords(
        doctor: string
    ) {

        return this.medicalRecordContract
            .getDoctorRecords(doctor);
    }

    async getHospitalRecords(
        hospital: string
    ) {

        return this.medicalRecordContract
            .getHospitalRecords(hospital);
    }

    /*
    ==========================================================
    UTILITIES
    ==========================================================
    */

    async recordExists(
        recordId: number
    ) {

        return this.medicalRecordContract
            .recordExists(recordId);
    }

    async totalRecords() {

        return this.medicalRecordContract
            .totalRecords();
    }
}