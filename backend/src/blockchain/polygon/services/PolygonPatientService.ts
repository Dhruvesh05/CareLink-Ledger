import { PatientRegistryContract } from "../contracts/PatientRegistryContract";

export class PolygonPatientService {

    private readonly patientRegistry =
        new PatientRegistryContract();

    /*
    ==========================================================
    PATIENT REGISTRATION
    ==========================================================
    */

    async registerPatient(
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ) {
        return await this.patientRegistry.registerPatient(
            fullNameHash,
            dobHash,
            bloodGroup,
            gender
        );
    }

    /*
    ==========================================================
    PATIENT READ
    ==========================================================
    */

    async getPatient(
        wallet: string
    ) {
        return await this.patientRegistry.getPatient(wallet);
    }

    async isPatientActive(
        wallet: string
    ): Promise<boolean> {
        return await this.patientRegistry.isPatientActive(wallet);
    }

    /*
    ==========================================================
    PATIENT UPDATE
    ==========================================================
    */

    async updateBloodGroup(
        newBloodGroup: string
    ) {
        return await this.patientRegistry.updateBloodGroup(
            newBloodGroup
        );
    }

    /*
    ==========================================================
    PATIENT STATUS
    ==========================================================
    */

    async deactivatePatient() {
        return await this.patientRegistry.deactivatePatient();
    }

    async reactivatePatient(
        wallet: string
    ) {
        return await this.patientRegistry.reactivatePatient(
            wallet
        );
    }

    /*
    ==========================================================
    PATIENT TOTAL
    ==========================================================
    */

    async totalPatients() {
        return await this.patientRegistry.totalPatients();
    }
}
