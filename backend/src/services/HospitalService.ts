import { EthereumHospitalService } from "../blockchain/ethereum/services/EthereumHospitalService";


export class HospitalService {


    private blockchainService: EthereumHospitalService;


    constructor(){

        this.blockchainService =
            new EthereumHospitalService();

    }


    async registerHospital(
        hospitalNameHash:string,
        registrationNumberHash:string,
        locationHash:string
    ){

        return await this.blockchainService.registerHospital(
            hospitalNameHash,
            registrationNumberHash,
            locationHash
        );

    }


    async verifyHospital(
        wallet:string
    ){

        return await this.blockchainService.verifyHospital(wallet);

    }


    async revokeVerification(
        wallet:string
    ){

        return await this.blockchainService.revokeVerification(wallet);

    }


    async reactivateHospital(
        wallet:string
    ){

        return await this.blockchainService.reactivateHospital(wallet);

    }


    async deactivateHospital(){

        return await this.blockchainService.deactivateHospital();

    }


    async updateLocation(
        newLocationHash:string
    ){

        return await this.blockchainService.updateLocation(newLocationHash);

    }


    async getHospital(
        wallet:string
    ){

        return await this.blockchainService.getHospital(wallet);

    }


    async isHospitalActive(
        wallet:string
    ){

        return await this.blockchainService.isHospitalActive(wallet);

    }


    async isHospitalVerified(
        wallet:string
    ){

        return await this.blockchainService.isHospitalVerified(wallet);

    }


    async totalHospitals(){

        return await this.blockchainService.totalHospitals();

    }

}