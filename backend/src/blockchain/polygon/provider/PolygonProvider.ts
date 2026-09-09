import { IBlockchainProvider } from "../../provider/IBlockchainProvider";

import { PolygonPatientService } from "../services/PolygonPatientService";
import { PolygonDoctorService } from "../services/PolygonDoctorService";
import { PolygonHospitalService } from "../services/PolygonHospitalService";
import { PolygonMedicalRecordService } from "../services/PolygonMedicalRecordService";
import { PolygonAuditService } from "../services/PolygonAuditService";

export class PolygonProvider implements IBlockchainProvider {

    private readonly patientService =
        new PolygonPatientService();

    private readonly doctorService =
        new PolygonDoctorService();

    private readonly hospitalService =
        new PolygonHospitalService();

    private readonly medicalRecordService =
        new PolygonMedicalRecordService();

    private readonly auditService =
        new PolygonAuditService();

    /*
    ==========================================================
    PATIENT
    ==========================================================
    */

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

    async updateBloodGroup(
        newBloodGroup: string
    ): Promise<any> {
        return await this.patientService.updateBloodGroup(
            newBloodGroup
        );
    }

    async deactivatePatient(): Promise<any> {
        return await this.patientService.deactivatePatient();
    }

    async reactivatePatient(
        wallet: string
    ): Promise<any> {
        return await this.patientService.reactivatePatient(
            wallet
        );
    }

    /*
    ==========================================================
    POLYGON-SPECIFIC PATIENT READ
    ==========================================================
    */

    async totalPatients(): Promise<any> {
        return await this.patientService.totalPatients();
    }

    /*
    ==========================================================
    DOCTOR
    ==========================================================
    */

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

    async getDoctorHospital(
        wallet: string
    ): Promise<any> {
        return await this.doctorService.getDoctorHospital(wallet);
    }

    async verifyDoctor(
        wallet: string
    ): Promise<any> {
        return await this.doctorService.verifyDoctor(wallet);
    }

    async revokeDoctorVerification(
        wallet: string
    ): Promise<any> {
        return await this.doctorService.revokeVerification(
            wallet
        );
    }

    async deactivateDoctor(): Promise<any> {
        return await this.doctorService.deactivateDoctor();
    }

    async reactivateDoctor(
        wallet: string
    ): Promise<any> {
        return await this.doctorService.reactivateDoctor(
            wallet
        );
    }

    async updateSpecialization(
        specialization: string
    ): Promise<any> {
        return await this.doctorService.updateSpecialization(
            specialization
        );
    }

    async totalDoctors(): Promise<any> {
        return await this.doctorService.totalDoctors();
    }

    /*
    ==========================================================
    HOSPITAL
    ==========================================================
    */

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
        return await this.hospitalService.verifyHospital(
            wallet
        );
    }

    async revokeHospitalVerification(
        wallet: string
    ): Promise<any> {
        return await this.hospitalService.revokeVerification(
            wallet
        );
    }

    async reactivateHospital(
        wallet: string
    ): Promise<any> {
        return await this.hospitalService.reactivateHospital(
            wallet
        );
    }

    async deactivateHospital(): Promise<any> {
        return await this.hospitalService.deactivateHospital();
    }

    async updateLocation(
        newLocationHash: string
    ): Promise<any> {
        return await this.hospitalService.updateLocation(
            newLocationHash
        );
    }

    async getHospital(
        wallet: string
    ): Promise<any> {
        return await this.hospitalService.getHospital(
            wallet
        );
    }

    async isHospitalActive(
        wallet: string
    ): Promise<boolean> {
        return await this.hospitalService.isHospitalActive(
            wallet
        );
    }

    async isHospitalVerified(
        wallet: string
    ): Promise<boolean> {
        return await this.hospitalService.isHospitalVerified(
            wallet
        );
    }

    async totalHospitals(): Promise<any> {
        return await this.hospitalService.totalHospitals();
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
    ): Promise<any> {
        return await this.medicalRecordService.createMedicalRecord(
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
        return await this.medicalRecordService.deactivateMedicalRecord(
            recordId
        );
    }

    async grantAccess(
        recordId: number,
        doctor: string
    ): Promise<any> {
        return await this.medicalRecordService.grantAccess(
            recordId,
            doctor
        );
    }

    async revokeAccess(
        recordId: number,
        doctor: string
    ): Promise<any> {
        return await this.medicalRecordService.revokeAccess(
            recordId,
            doctor
        );
    }

    async isAuthorizedDoctor(
        recordId: number,
        doctor: string
    ): Promise<boolean> {
        return await this.medicalRecordService.isAuthorizedDoctor(
            recordId,
            doctor
        );
    }

    async viewRecord(
        recordId: number
    ): Promise<any> {
        return await this.medicalRecordService.viewRecord(
            recordId
        );
    }

    async logDownload(
        recordId: number
    ): Promise<any> {
        return await this.medicalRecordService.logDownload(
            recordId
        );
    }

    async getMedicalRecord(
        recordId: number
    ): Promise<any> {
        return await this.medicalRecordService.getMedicalRecord(
            recordId
        );
    }

    async getPatientRecords(
        patient: string
    ): Promise<any> {
        return await this.medicalRecordService.getPatientRecords(
            patient
        );
    }

    async getDoctorRecords(
        doctor: string
    ): Promise<any> {
        return await this.medicalRecordService.getDoctorRecords(
            doctor
        );
    }

    async getHospitalRecords(
        hospital: string
    ): Promise<any> {
        return await this.medicalRecordService.getHospitalRecords(
            hospital
        );
    }

    async recordExists(
        recordId: number
    ): Promise<boolean> {
        return await this.medicalRecordService.recordExists(
            recordId
        );
    }

    async totalRecords(): Promise<any> {
        return await this.medicalRecordService.totalRecords();
    }

    /*
    ==========================================================
    AUDIT
    ==========================================================
    */

    async getAudit(
        logId: number
    ): Promise<any> {
        return await this.auditService.getAudit(logId);
    }

    async getRecordAuditLogs(
        recordId: number
    ): Promise<any> {
        return await this.auditService.getRecordAuditLogs(
            recordId
        );
    }

    async totalAuditLogs(): Promise<any> {
        return await this.auditService.totalAuditLogs();
    }
}
