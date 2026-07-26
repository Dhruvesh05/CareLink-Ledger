import { MedicalRecordContract } from "../contracts/MedicalRecordContract";


export class EthereumMedicalRecordService {

    private medicalRecordContract: MedicalRecordContract;


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

        return await this.medicalRecordContract.createMedicalRecord(
            patient,
            ipfsHash,
            fileHash,
            category,
            emergency
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


    async deactivateMedicalRecord(
        recordId: number
    ) {

        return await this.medicalRecordContract.deactivateMedicalRecord(
            recordId
        );

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

        return await this.medicalRecordContract.grantAccess(
            recordId,
            doctor
        );

    }


    async revokeAccess(
        recordId: number,
        doctor: string
    ) {

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


    /*
    ==========================================================
    READ ACCESS (AUDIT-LOGGING VARIANTS)
    ==========================================================
    */

    async viewRecord(
        recordId: number
    ) {

        return await this.medicalRecordContract.viewRecord(
            recordId
        );

    }


    async logDownload(
        recordId: number
    ) {

        return await this.medicalRecordContract.logDownload(
            recordId
        );

    }


    /*
    ==========================================================
    READ ACCESS (FREE VIEW CALLS)
    ==========================================================
    */

    async getMedicalRecord(
        recordId: number
    ) {

        return await this.medicalRecordContract.getMedicalRecord(
            recordId
        );

    }


    async getPatientRecords(
        patient: string
    ) {

        return await this.medicalRecordContract.getPatientRecords(
            patient
        );

    }


    async getDoctorRecords(
        doctor: string
    ) {

        return await this.medicalRecordContract.getDoctorRecords(
            doctor
        );

    }


    async getHospitalRecords(
        hospital: string
    ) {

        return await this.medicalRecordContract.getHospitalRecords(
            hospital
        );

    }


    async recordExists(
        recordId: number
    ) {

        return await this.medicalRecordContract.recordExists(
            recordId
        );

    }


    async totalRecords() {

        return await this.medicalRecordContract.totalRecords();

    }

}