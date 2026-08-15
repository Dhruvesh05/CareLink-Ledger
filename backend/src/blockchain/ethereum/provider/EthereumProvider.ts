import { IBlockchainProvider } from "../../provider/IBlockchainProvider";
import { EthereumPatientService } from "../services/EthereumPatientService";
import { EthereumDoctorService } from "../services/EthereumDoctorService";
import { EthereumHospitalService } from "../services/EthereumHospitalService";
import { EthereumMedicalRecordService } from "../services/EthereumMedicalRecordService";

export class EthereumProvider implements IBlockchainProvider {

    private patientService =
        new EthereumPatientService();

    private doctorService =
        new EthereumDoctorService();

    private hospitalService =
        new EthereumHospitalService();

    private medicalRecordService =
        new EthereumMedicalRecordService();

    async registerPatient(

        fullNameHash: string,

        dobHash: string,

        bloodGroup: string,

        gender: string

    ): Promise<any> {

        return await this.patientService.registerPatient(

            fullNameHash,

            dobHash,

            bloodGroup,

            gender

        );

    }

    async getPatient(
        wallet: string
    ): Promise<any> {
        return await this.patientService.getPatient(wallet);
    }

    async isPatientActive(
        wallet: string
    ): Promise<boolean> {
        return await this.patientService.isPatientActive(wallet);
    }

    async registerDoctor(
        fullNameHash: string,
        licenseHash: string,
        specialization: string,
        hospital: string
    ): Promise<any> {
        return await this.doctorService.registerDoctor(
            fullNameHash,
            licenseHash,
            specialization,
            hospital
        );
    }

    async verifyDoctor(
        wallet: string
    ): Promise<any> {
        return await this.doctorService.verifyDoctor(wallet);
    }

    async getDoctor(
        wallet: string
    ): Promise<any> {
        return await this.doctorService.getDoctor(wallet);
    }

    async isDoctorActive(
        wallet: string
    ): Promise<boolean> {
        return await this.doctorService.isDoctorActive(wallet);
    }

    async isDoctorVerified(
        wallet: string
    ): Promise<boolean> {
        return await this.doctorService.isDoctorVerified(wallet);
    }

    async registerHospital(
        hospitalNameHash: string,
        registrationNumberHash: string,
        locationHash: string
    ): Promise<any> {
        return await this.hospitalService.registerHospital(
            hospitalNameHash,
            registrationNumberHash,
            locationHash
        );
    }

    async verifyHospital(
        wallet: string
    ): Promise<any> {
        return await this.hospitalService.verifyHospital(wallet);
    }

    async getHospital(
        wallet: string
    ): Promise<any> {
        return await this.hospitalService.getHospital(wallet);
    }

    async isHospitalActive(
        wallet: string
    ): Promise<boolean> {
        return await this.hospitalService.isHospitalActive(wallet);
    }

    async isHospitalVerified(
        wallet: string
    ): Promise<boolean> {
        return await this.hospitalService.isHospitalVerified(wallet);
    }

    async createMedicalRecord(
        patient: string,
        ipfsHash: string,
        fileHash: string,
        category: string,
        emergency: boolean
    ): Promise<any> {
        return await this.medicalRecordService.createMedicalRecord(
            patient,
            ipfsHash,
            fileHash,
            category,
            emergency
        );
    }

    async getMedicalRecord(
        recordId: number
    ): Promise<any> {
        return await this.medicalRecordService.getMedicalRecord(recordId);
    }

    async updateMedicalRecord(
        recordId: number,
        ipfsHash: string,
        fileHash: string,
        category: string,
        expectedVersion: number
    ): Promise<any> {
        return await this.medicalRecordService.updateMedicalRecord(
            recordId,
            ipfsHash,
            fileHash,
            category,
            expectedVersion
        );
    }

    async deactivateMedicalRecord(
        recordId: number
    ): Promise<any> {
        return await this.medicalRecordService.deactivateMedicalRecord(recordId);
    }

    async grantAccess(
        recordId: number,
        doctor: string
    ): Promise<any> {
        return await this.medicalRecordService.grantAccess(recordId, doctor);
    }

    async revokeAccess(
        recordId: number,
        doctor: string
    ): Promise<any> {
        return await this.medicalRecordService.revokeAccess(recordId, doctor);
    }

    async getPatientRecords(
        patient: string
    ): Promise<any> {
        return await this.medicalRecordService.getPatientRecords(patient);
    }

    async getDoctorRecords(
        doctor: string
    ): Promise<any> {
        return await this.medicalRecordService.getDoctorRecords(doctor);
    }

    async getHospitalRecords(
        hospital: string
    ): Promise<any> {
        return await this.medicalRecordService.getHospitalRecords(hospital);
    }

    async viewRecord(
        recordId: number
    ): Promise<any> {
        return await this.medicalRecordService.viewRecord(recordId);
    }

    async logDownload(
        recordId: number
    ): Promise<any> {
        return await this.medicalRecordService.logDownload(recordId);
    }

    async recordExists(
        recordId: number
    ): Promise<boolean> {
        return await this.medicalRecordService.recordExists(recordId);
    }

    async totalRecords(): Promise<any> {
        return await this.medicalRecordService.totalRecords();
    }

}