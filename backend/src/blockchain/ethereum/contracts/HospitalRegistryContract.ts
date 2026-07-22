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



}