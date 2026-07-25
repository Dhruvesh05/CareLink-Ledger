import { HospitalRegistryContract } from "../contracts/HospitalRegistryContract";


export class EthereumHospitalService {

    private hospitalContract: HospitalRegistryContract;


    constructor(){

        this.hospitalContract =
            new HospitalRegistryContract();

    }


    async registerHospital(
        hospitalNameHash:string,
        registrationNumberHash:string,
        locationHash:string
    ){

        return await this.hospitalContract.registerHospital(
            hospitalNameHash,
            registrationNumberHash,
            locationHash
        );

    }


    async verifyHospital(
        wallet:string
    ){

        return await this.hospitalContract.verifyHospital(wallet);

    }


    async revokeVerification(
        wallet:string
    ){

        return await this.hospitalContract.revokeVerification(wallet);

    }


    async reactivateHospital(
        wallet:string
    ){

        return await this.hospitalContract.reactivateHospital(wallet);

    }


    async deactivateHospital(){

        return await this.hospitalContract.deactivateHospital();

    }


    async updateLocation(
        newLocationHash:string
    ){

        return await this.hospitalContract.updateLocation(newLocationHash);

    }


    async getHospital(
        wallet:string
    ){

        return await this.hospitalContract.getHospital(wallet);

    }


    async isHospitalActive(
        wallet:string
    ){

        return await this.hospitalContract.isHospitalActive(wallet);

    }


    async isHospitalVerified(
        wallet:string
    ){

        return await this.hospitalContract.isHospitalVerified(wallet);

    }


    async totalHospitals(){

        return await this.hospitalContract.totalHospitals();

    }

}