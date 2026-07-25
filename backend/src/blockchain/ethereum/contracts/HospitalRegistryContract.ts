import { ethereum } from "../config/ethereum";


export class HospitalRegistryContract {


    async registerHospital(
        hospitalNameHash: string,
        registrationNumberHash: string,
        locationHash: string
    ) {


        const tx =
            await ethereum.hospitalRegistry.registerHospital(
                hospitalNameHash,
                registrationNumberHash,
                locationHash
            );


        return await tx.wait();

    }





    async verifyHospital(
        wallet: string
    ) {


        const tx =
            await ethereum.hospitalRegistry.verifyHospital(
                wallet
            );


        return await tx.wait();

    }





    async revokeVerification(
        wallet: string
    ) {


        const tx =
            await ethereum.hospitalRegistry.revokeVerification(
                wallet
            );


        return await tx.wait();

    }





    async reactivateHospital(
        wallet: string
    ) {


        const tx =
            await ethereum.hospitalRegistry.reactivateHospital(
                wallet
            );


        return await tx.wait();

    }





    async deactivateHospital() {


        const tx =
            await ethereum.hospitalRegistry.deactivateHospital();


        return await tx.wait();

    }





    async updateLocation(
        newLocationHash: string
    ) {


        const tx =
            await ethereum.hospitalRegistry.updateLocation(
                newLocationHash
            );


        return await tx.wait();

    }





    async getHospital(
        wallet: string
    ) {


        return await ethereum.hospitalRegistry.getHospital(
            wallet
        );

    }





    async isHospitalActive(
        wallet: string
    ) {


        return await ethereum.hospitalRegistry.isHospitalActive(
            wallet
        );

    }





    async isHospitalVerified(
        wallet: string
    ) {


        return await ethereum.hospitalRegistry.isHospitalVerified(
            wallet
        );

    }





    async totalHospitals() {


        return await ethereum.hospitalRegistry.totalHospitals();

    }



}