import { DoctorRegistryContract } from "../contracts/DoctorRegistryContract";

export class EthereumDoctorService {

    private doctorRegistry =
        new DoctorRegistryContract();

    async registerDoctor(
        fullNameHash: string,
        licenseNumberHash: string,
        specialization: string,
        hospital: string
    ) {

        return await this.doctorRegistry.registerDoctor(
            fullNameHash,
            licenseNumberHash,
            specialization,
            hospital
        );

    }

    async getDoctor(wallet: string) {

        return await this.doctorRegistry.getDoctor(wallet);

    }

    async isDoctorActive(wallet: string) {

        return await this.doctorRegistry.isDoctorActive(wallet);

    }

    async isDoctorVerified(wallet: string) {

        return await this.doctorRegistry.isDoctorVerified(wallet);

    }

    async getDoctorHospital(wallet: string) {

        return await this.doctorRegistry.getDoctorHospital(wallet);

    }

    async verifyDoctor(wallet: string) {

        return await this.doctorRegistry.verifyDoctor(wallet);

    }

    async revokeVerification(wallet: string) {

        return await this.doctorRegistry.revokeVerification(wallet);

    }

    async deactivateDoctor() {

        return await this.doctorRegistry.deactivateDoctor();

    }

    async reactivateDoctor(wallet: string) {

        return await this.doctorRegistry.reactivateDoctor(wallet);

    }

    async updateSpecialization(specialization: string) {

        return await this.doctorRegistry.updateSpecialization(specialization);

    }

    async totalDoctors() {

        return await this.doctorRegistry.totalDoctors();

    }

}