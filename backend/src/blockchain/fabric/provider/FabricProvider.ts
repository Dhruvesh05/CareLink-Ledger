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

    private async submitWithTransactionId(
        transaction: string,
        ...args: string[]
    ): Promise<any> {
        const contract = this.contract();

        console.log("[fabric-debug] SUBMIT START", transaction, args);

        const submitted = await contract.submitAsync(
            transaction,
            {
                arguments: args,
                endorsingOrganizations: ["CareLinkMSP"],
            }
        );

        console.log("[fabric-debug] SUBMIT ASYNC RETURNED");

        const transactionId = submitted.getTransactionId();
        console.log("[fabric-debug] TX ID", transactionId);

        const result = submitted.getResult();
        console.log("[fabric-debug] RESULT RECEIVED", result?.length ?? 0);

        const status = await submitted.getStatus();
        console.log("[fabric-debug] STATUS", status);

        if (!status.successful) {
            throw new Error(
                `Fabric transaction ${transactionId} failed with status code ${status.code}`
            );
        }

        if (!result || result.length === 0) {
            return {
                success: true,
                transactionId,
            };
        }

        const text = Buffer.from(result).toString("utf8");

        try {
            const parsed = JSON.parse(text);

            if (parsed && typeof parsed === "object") {
                return {
                    ...parsed,
                    transactionId,
                };
            }

            return {
                result: parsed,
                transactionId,
            };
        } catch {
            return {
                result: text,
                transactionId,
            };
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

    async registerPatientFromBridge(
        messageId: string,
        sourceChain: string,
        wallet: string,
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ): Promise<any> {
        return await this.submitWithTransactionId(
            "RegisterPatientFromBridge",
            messageId,
            sourceChain,
            wallet,
            fullNameHash,
            dobHash,
            bloodGroup,
            gender
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
        return await this.submitWithTransactionId(
            "ReactivatePatient",
            `polygon_${wallet}`
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

    async registerDoctorFromBridge(
        messageId: string,
        sourceChain: string,
        wallet: string,
        fullNameHash: string,
        licenseNumberHash: string,
        specialization: string,
        hospitalWallet: string
    ): Promise<any> {
        return await this.submitWithTransactionId(
            "RegisterDoctorFromBridge",
            messageId,
            sourceChain,
            wallet,
            fullNameHash,
            licenseNumberHash,
            specialization,
            hospitalWallet
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
        wallet: string
    ): Promise<boolean> {
        return Boolean(
            await this.evaluate(
                "IsDoctorVerified",
                wallet
            )
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
        wallet: string
    ): Promise<any> {
        return await this.submit(
            "VerifyDoctor",
            wallet
        );
    }

    async revokeDoctorVerification(
        wallet: string
    ): Promise<any> {
        return await this.submit(
            "RevokeDoctorVerification",
            wallet
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

    async registerHospitalFromBridge(
        messageId: string,
        sourceChain: string,
        wallet: string,
        hospitalNameHash: string,
        registrationNumberHash: string,
        locationHash: string
    ): Promise<any> {
        return await this.submitWithTransactionId(
            "RegisterHospitalFromBridge",
            messageId,
            sourceChain,
            wallet,
            hospitalNameHash,
            registrationNumberHash,
            locationHash
        );
    }

    async verifyHospital(
        wallet: string
    ): Promise<any> {
        return await this.submit(
            "VerifyHospital",
            wallet
        );
    }

    async revokeHospitalVerification(
        wallet: string
    ): Promise<any> {
        return await this.submit(
            "RevokeHospitalVerification",
            wallet
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
        wallet: string
    ): Promise<boolean> {
        return Boolean(
            await this.evaluate(
                "IsHospitalVerified",
                wallet
            )
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
    ): Promise<any> {
        return await this.submitWithTransactionId(
            "CreateMedicalRecordFromBridge",
            messageId,
            sourceChain,
            String(sourceRecordId),
            patient,
            doctor,
            hospital,
            ipfsHash,
            fileHash,
            category,
            String(emergency)
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
    ): Promise<any> {
        return await this.submitWithTransactionId(
            "UpdateMedicalRecordFromBridge",
            messageId,
            sourceChain,
            String(sourceRecordId),
            newIpfsHash,
            newFileHash,
            newCategory,
            String(expectedVersion)
        );
    }

    async deactivateMedicalRecordFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        actor: string
    ): Promise<any> {
        return await this.submitWithTransactionId(
            "DeactivateMedicalRecordFromBridge",
            messageId,
            sourceChain,
            String(sourceRecordId),
            actor
        );
    }

    async grantAccessFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        doctor: string
    ): Promise<any> {
        return await this.submitWithTransactionId(
            "GrantAccessFromBridge",
            messageId,
            sourceChain,
            String(sourceRecordId),
            doctor
        );
    }

    async revokeAccessFromBridge(
        messageId: string,
        sourceChain: string,
        sourceRecordId: number,
        doctor: string
    ): Promise<any> {
        return await this.submitWithTransactionId(
            "RevokeAccessFromBridge",
            messageId,
            sourceChain,
            String(sourceRecordId),
            doctor
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
