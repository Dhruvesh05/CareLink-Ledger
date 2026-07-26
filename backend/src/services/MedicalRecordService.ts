import { EthereumMedicalRecordService } from "../blockchain/ethereum/services/EthereumMedicalRecordService";


export class MedicalRecordService {

    private blockchainService: EthereumMedicalRecordService;

    constructor() {

        this.blockchainService =
            new EthereumMedicalRecordService();

    }

    /*
    ==========================================================
    MEDICAL RECORD
    ==========================================================
    */

    async createMedicalRecord(
        patient: string,
        ipfsHash: string,
        fileHash: string,
        category: string,
        emergency: boolean
    ) {

        return await this.blockchainService.createMedicalRecord(
            patient,
            ipfsHash,
            fileHash,
            category,
            emergency
        );

    }

    async getMedicalRecord(
        recordId: number
    ) {

        return await this.blockchainService.getMedicalRecord(
            recordId
        );

    }

    async updateMedicalRecord(
        recordId: number,
        ipfsHash: string,
        fileHash: string,
        category: string,
        expectedVersion: number
    ) {

        return await this.blockchainService.updateMedicalRecord(
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

        return await this.blockchainService.deactivateMedicalRecord(
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

        return await this.blockchainService.grantAccess(
            recordId,
            doctor
        );

    }

    async revokeAccess(
        recordId: number,
        doctor: string
    ) {

        return await this.blockchainService.revokeAccess(
            recordId,
            doctor
        );

    }

    async isAuthorizedDoctor(
        recordId: number,
        doctor: string
    ) {

        return await this.blockchainService.isAuthorizedDoctor(
            recordId,
            doctor
        );

    }

    /*
    ==========================================================
    RECORD VIEWS
    ==========================================================
    */

    async viewRecord(
        recordId: number
    ) {

        return await this.blockchainService.viewRecord(
            recordId
        );

    }

    async getPatientRecords(
        patient: string
    ) {

        return await this.blockchainService.getPatientRecords(
            patient
        );

    }

    async getDoctorRecords(
        doctor: string
    ) {

        return await this.blockchainService.getDoctorRecords(
            doctor
        );

    }

    async getHospitalRecords(
        hospital: string
    ) {

        return await this.blockchainService.getHospitalRecords(
            hospital
        );

    }

    /*
    ==========================================================
    AUDIT
    ==========================================================
    */

    async logDownload(
        recordId: number
    ) {

        return await this.blockchainService.logDownload(
            recordId
        );

    }

    /*
    ==========================================================
    UTILITIES
    ==========================================================
    */

    async recordExists(
        recordId: number
    ) {

        return await this.blockchainService.recordExists(
            recordId
        );

    }

    async totalRecords() {

        return await this.blockchainService.totalRecords();

    }

}