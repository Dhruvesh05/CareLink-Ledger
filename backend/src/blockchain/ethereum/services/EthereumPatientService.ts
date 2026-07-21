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

}