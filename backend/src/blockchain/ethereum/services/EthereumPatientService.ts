import { PatientRegistryContract } from "../contracts/PatientRegistryContract";

export class EthereumPatientService {

    private patientRegistry =
        new PatientRegistryContract();

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

    async getPatient(wallet: string) {

        return await this.patientRegistry.getPatient(wallet);

    }

    async isPatientActive(wallet: string) {

        return await this.patientRegistry.isPatientActive(wallet);

    }

    async updateBloodGroup(newBloodGroup: string) {

        return await this.patientRegistry.updateBloodGroup(newBloodGroup);

    }

    async deactivatePatient() {

        return await this.patientRegistry.deactivatePatient();

    }

    async reactivatePatient(wallet: string) {

        return await this.patientRegistry.reactivatePatient(wallet);

    }

}