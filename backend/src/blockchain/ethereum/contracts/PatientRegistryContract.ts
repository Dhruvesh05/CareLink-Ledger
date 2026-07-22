import { ethereum } from "../config/ethereum";


export class PatientRegistryContract {


    async registerPatient(
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ) {


        const tx =
            await ethereum.patientRegistry.registerPatient(
                fullNameHash,
                dobHash,
                bloodGroup,
                gender
            );


        return await tx.wait();

    }





    async getPatient(
        wallet: string
    ) {


        return await ethereum.patientRegistry.getPatient(
            wallet
        );

    }





    async isPatientActive(
        wallet: string
    ) {


        return await ethereum.patientRegistry.isPatientActive(
            wallet
        );

    }





    async updateBloodGroup(
        newBloodGroup: string
    ) {


        const tx =
            await ethereum.patientRegistry.updateBloodGroup(
                newBloodGroup
            );


        return await tx.wait();

    }





    async deactivatePatient() {


        const tx =
            await ethereum.patientRegistry.deactivatePatient();


        return await tx.wait();

    }





    async reactivatePatient(
        wallet: string
    ) {


        const tx =
            await ethereum.patientRegistry.reactivatePatient(
                wallet
            );


        return await tx.wait();

    }



}