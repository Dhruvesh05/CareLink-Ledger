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

}