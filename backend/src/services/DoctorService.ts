import { EthereumDoctorService } from "../blockchain/ethereum/services/EthereumDoctorService";


export class DoctorService {

    private blockchainService: EthereumDoctorService;

    constructor() {

        this.blockchainService =
            new EthereumDoctorService();

    }

    async registerDoctor(
        fullNameHash: string,
        licenseHash: string,
        specialization: string,
        hospital: string
    ) {

        return await this.blockchainService.registerDoctor(
            fullNameHash,
            licenseHash,
            specialization,
            hospital
        );

    }

    async getDoctor(wallet: string) {

        return await this.blockchainService.getDoctor(wallet);

    }

    async isDoctorActive(wallet: string) {

        return await this.blockchainService.isDoctorActive(wallet);

    }

    async isDoctorVerified(wallet: string) {

        return await this.blockchainService.isDoctorVerified(wallet);

    }

    async getDoctorHospital(wallet: string) {

        return await this.blockchainService.getDoctorHospital(wallet);

    }

    async verifyDoctor(wallet: string) {

        return await this.blockchainService.verifyDoctor(wallet);

    }

    async revokeVerification(wallet: string) {

        return await this.blockchainService.revokeVerification(wallet);

    }

    async deactivateDoctor() {

        return await this.blockchainService.deactivateDoctor();

    }

    async reactivateDoctor(wallet: string) {

        return await this.blockchainService.reactivateDoctor(wallet);

    }

    async updateSpecialization(specialization: string) {

        return await this.blockchainService.updateSpecialization(specialization);

    }

    async totalDoctors() {

        return await this.blockchainService.totalDoctors();

    }

}