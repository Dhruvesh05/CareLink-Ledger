import { EthereumProvider } from "../blockchain/ethereum/EthereumProvider";

export class MedicalRecordService {

    private blockchain: EthereumProvider;

    constructor() {
        this.blockchain = new EthereumProvider();
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

        return await this.blockchain.createMedicalRecord(
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

        return await this.blockchain.getMedicalRecord(
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

        return await this.blockchain.updateMedicalRecord(
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

        return await this.blockchain.deactivateMedicalRecord(
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

        return await this.blockchain.grantAccess(
            recordId,
            doctor
        );

    }

    async revokeAccess(
        recordId: number,
        doctor: string
    ) {

        return await this.blockchain.revokeAccess(
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

        return await this.blockchain.viewRecord(
            recordId
        );

    }

    async getPatientRecords(
        patient: string
    ) {

        return await this.blockchain.getPatientRecords(
            patient
        );

    }

    async getDoctorRecords(
        doctor: string
    ) {

        return await this.blockchain.getDoctorRecords(
            doctor
        );

    }

    async getHospitalRecords(
        hospital: string
    ) {

        return await this.blockchain.getHospitalRecords(
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

        return await this.blockchain.logDownload(
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

        return await this.blockchain.recordExists(
            recordId
        );

    }

    async totalRecords() {

        return await this.blockchain.totalRecords();

    }

}