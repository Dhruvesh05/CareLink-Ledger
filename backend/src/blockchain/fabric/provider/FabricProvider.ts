import { FabricGateway } from "../FabricGateway";
import { IBlockchainProvider } from "../../provider/IBlockchainProvider";

export class FabricProvider implements IBlockchainProvider {
    private readonly gateway = new FabricGateway();

    private contract() {
        return this.gateway.getContract();
    }

    private async submit(
        transaction: string,
        ...args: string[]
    ): Promise<any> {
        const contract = this.contract();

        const result = await contract.submit(
            transaction,
            {
                arguments: args,
                endorsingOrganizations: ["CareLinkMSP"],
            }
        );

        if (!result || result.length === 0) {
            return { success: true };
        }

        const text = Buffer.from(result).toString("utf8");

        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    private async evaluate(
        transaction: string,
        ...args: string[]
    ): Promise<any> {
        const result = await this.contract().evaluateTransaction(
            transaction,
            ...args
        );

        if (!result || result.length === 0) {
            return null;
        }

        const text = Buffer.from(result).toString("utf8");

        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    private unsupported(message: string): never {
        throw new Error(`Fabric operation unsupported: ${message}`);
    }

    /*
    ==========================================================
    PATIENT
    ==========================================================
    */

    async registerPatient(
        fullNameHash: string,
        dobHash: string,
        _bloodGroup: string,
        gender: string
    ): Promise<any> {
        /*
         * Existing IBlockchainProvider does not expose a separate
         * Fabric patient ID or wallet.
         *
         * Until the canonical provider interface is migrated to
         * request objects, use fullNameHash as the deterministic
         * Fabric patient identifier.
         *
         * IMPORTANT:
         * This is an adapter-level compatibility mapping.
         */
        const patientId = fullNameHash;
        const wallet = fullNameHash;

        return await this.submit(
            "RegisterPatient",
            patientId,
            fullNameHash,
            dobHash,
            gender,
            wallet
        );
    }

    async getPatient(wallet: string): Promise<any> {
        return await this.evaluate("GetPatient", wallet);
    }

    async isPatientActive(wallet: string): Promise<boolean> {
        return Boolean(
            await this.evaluate(
                "IsPatientActive",
                wallet
            )
        );
    }

    async updateBloodGroup(
        _newBloodGroup: string
    ): Promise<any> {
        return this.unsupported(
            "chaincode does not implement UpdateBloodGroup"
        );
    }

    async deactivatePatient(): Promise<any> {
        return this.unsupported(
            "DeactivatePatient requires a Fabric patient ID"
        );
    }

    async reactivatePatient(wallet: string): Promise<any> {
        return await this.submit(
            "ReactivatePatient",
            wallet
        );
    }

    /*
    ==========================================================
    DOCTOR
    ==========================================================
    */

    async registerDoctor(
        fullNameHash: string,
        _licenseHash: string,
        specialization: string,
        hospital: string
    ): Promise<any> {
        const doctorId = fullNameHash;
        const wallet = fullNameHash;

        return await this.submit(
            "RegisterDoctor",
            doctorId,
            fullNameHash,
            specialization,
            hospital,
            wallet
        );
    }

    async getDoctor(wallet: string): Promise<any> {
        return await this.evaluate(
            "GetDoctor",
            wallet
        );
    }

    async isDoctorActive(wallet: string): Promise<boolean> {
        return Boolean(
            await this.evaluate(
                "IsDoctorActive",
                wallet
            )
        );
    }

    async isDoctorVerified(
        _wallet: string
    ): Promise<boolean> {
        return this.unsupported(
            "Fabric chaincode does not implement doctor verification"
        );
    }

    async getDoctorHospital(wallet: string): Promise<any> {
        const doctor = await this.evaluate(
            "GetDoctor",
            wallet
        );

        if (!doctor) {
            return null;
        }

        return (
            doctor.HospitalID ??
            doctor.hospitalID ??
            doctor.hospitalId ??
            null
        );
    }

    async verifyDoctor(
        _wallet: string
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement doctor verification"
        );
    }

    async revokeDoctorVerification(
        _wallet: string
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement doctor verification"
        );
    }

    async deactivateDoctor(): Promise<any> {
        return this.unsupported(
            "DeactivateDoctor requires a Fabric doctor ID"
        );
    }

    async reactivateDoctor(wallet: string): Promise<any> {
        return await this.submit(
            "ReactivateDoctor",
            wallet
        );
    }

    async updateSpecialization(
        _specialization: string
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement UpdateSpecialization"
        );
    }

    async totalDoctors(): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement TotalDoctors"
        );
    }

    /*
    ==========================================================
    HOSPITAL
    ==========================================================
    */

    async registerHospital(
        hospitalNameHash: string,
        _registrationNumberHash: string,
        locationHash: string
    ): Promise<any> {
        const hospitalId = hospitalNameHash;
        const wallet = hospitalNameHash;

        return await this.submit(
            "RegisterHospital",
            hospitalId,
            hospitalNameHash,
            locationHash,
            wallet
        );
    }

    async verifyHospital(
        _wallet: string
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement hospital verification"
        );
    }

    async revokeHospitalVerification(
        _wallet: string
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement hospital verification"
        );
    }

    async reactivateHospital(wallet: string): Promise<any> {
        return await this.submit(
            "ReactivateHospital",
            wallet
        );
    }

    async deactivateHospital(): Promise<any> {
        return this.unsupported(
            "DeactivateHospital requires a Fabric hospital ID"
        );
    }

    async updateLocation(
        _newLocationHash: string
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement UpdateLocation"
        );
    }

    async getHospital(wallet: string): Promise<any> {
        return await this.evaluate(
            "GetHospital",
            wallet
        );
    }

    async isHospitalActive(wallet: string): Promise<boolean> {
        return Boolean(
            await this.evaluate(
                "IsHospitalActive",
                wallet
            )
        );
    }

    async isHospitalVerified(
        _wallet: string
    ): Promise<boolean> {
        return this.unsupported(
            "Fabric chaincode does not implement hospital verification"
        );
    }

    async totalHospitals(): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement TotalHospitals"
        );
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
        const recordId =
            `${patient}_${fileHash}`;

        return await this.submit(
            "CreateMedicalRecord",
            recordId,
            patient,
            "",
            "",
            ipfsHash,
            fileHash,
            category,
            String(emergency)
        );
    }

    async updateMedicalRecord(
        _recordId: number,
        _ipfsHash: string,
        _fileHash: string,
        _category: string,
        _expectedVersion: number
    ): Promise<any> {
        return this.unsupported(
            "Fabric UpdateMedicalRecord uses a different canonical parameter model"
        );
    }

    async deactivateMedicalRecord(
        _recordId: number
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement DeactivateMedicalRecord"
        );
    }

    async grantAccess(
        _recordId: number,
        _doctor: string
    ): Promise<any> {
        return this.unsupported(
            "Fabric GrantAccess requires patient ID and grantee ID"
        );
    }

    async revokeAccess(
        _recordId: number,
        _doctor: string
    ): Promise<any> {
        return this.unsupported(
            "Fabric RevokeAccess requires patient ID and grantee ID"
        );
    }

    async isAuthorizedDoctor(
        _recordId: number,
        _doctor: string
    ): Promise<boolean> {
        return this.unsupported(
            "Fabric chaincode does not implement IsAuthorizedDoctor"
        );
    }

    async viewRecord(
        _recordId: number
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement ViewRecord"
        );
    }

    async logDownload(
        _recordId: number
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement LogDownload"
        );
    }

    async getMedicalRecord(
        recordId: number
    ): Promise<any> {
        return await this.evaluate(
            "GetMedicalRecord",
            String(recordId)
        );
    }

    async getPatientRecords(
        patient: string
    ): Promise<any> {
        return await this.evaluate(
            "GetPatientRecords",
            patient
        );
    }

    async getDoctorRecords(
        doctor: string
    ): Promise<any> {
        return await this.evaluate(
            "GetDoctorRecords",
            doctor
        );
    }

    async getHospitalRecords(
        hospital: string
    ): Promise<any> {
        return await this.evaluate(
            "GetHospitalRecords",
            hospital
        );
    }

    async recordExists(
        recordId: number
    ): Promise<boolean> {
        try {
            await this.evaluate(
                "GetMedicalRecord",
                String(recordId)
            );

            return true;
        } catch {
            return false;
        }
    }

    async totalRecords(): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement TotalRecords"
        );
    }

    /*
    ==========================================================
    AUDIT
    ==========================================================
    */

    async getAudit(
        logId: number
    ): Promise<any> {
        return await this.evaluate(
            "GetAudit",
            String(logId)
        );
    }

    async getRecordAuditLogs(
        _recordId: number
    ): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement GetRecordAuditLogs"
        );
    }

    async totalAuditLogs(): Promise<any> {
        return this.unsupported(
            "Fabric chaincode does not implement TotalAuditLogs"
        );
    }
}
