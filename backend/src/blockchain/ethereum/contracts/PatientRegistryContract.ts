import { ethereum } from "../config/ethereum";

export class PatientRegistryContract {

    async registerPatient(
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ) {

        const tx = await ethereum.patientRegistry.registerPatient(
            fullNameHash,
            dobHash,
            bloodGroup,
            gender
        );

        return await tx.wait();

    }

    async getPatient(wallet: string) {

        return await ethereum.patientRegistry.getPatient(wallet);

    }

    async isPatientActive(wallet: string) {

        return await ethereum.patientRegistry.isPatientActive(wallet);

    }

    async getRecordCount(wallet: string) {

        return await ethereum.patientRegistry.getRecordCount(wallet);

    }

    async updateBloodGroup(
        bloodGroup: string
    ) {

        const tx =
            await ethereum.patientRegistry.updateBloodGroup(
                bloodGroup
            );

        return await tx.wait();

    }

}