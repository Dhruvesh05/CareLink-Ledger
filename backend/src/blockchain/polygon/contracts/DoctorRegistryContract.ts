import { polygon } from "../config/polygon";

export class DoctorRegistryContract {
    private readonly contract = polygon.doctorRegistry;

    async registerDoctor(
        fullNameHash: string,
        licenseNumberHash: string,
        specialization: string,
        hospital: string
    ) {
        const tx = await this.contract.registerDoctor(
            fullNameHash,
            licenseNumberHash,
            specialization,
            hospital
        );

        return await tx.wait();
    }

    async getDoctor(wallet: string) {
        return await this.contract.getDoctor(wallet);
    }

    async isDoctorActive(wallet: string) {
        return await this.contract.isDoctorActive(wallet);
    }

    async isDoctorVerified(wallet: string) {
        return await this.contract.isDoctorVerified(wallet);
    }

    async getDoctorHospital(wallet: string) {
        return await this.contract.getDoctorHospital(wallet);
    }

    async verifyDoctor(wallet: string) {
        const tx = await this.contract.verifyDoctor(wallet);
        return await tx.wait();
    }

    async revokeVerification(wallet: string) {
        const tx = await this.contract.revokeVerification(wallet);
        return await tx.wait();
    }

    async deactivateDoctor() {
        const tx = await this.contract.deactivateDoctor();
        return await tx.wait();
    }

    async reactivateDoctor(wallet: string) {
        const tx = await this.contract.reactivateDoctor(wallet);
        return await tx.wait();
    }

    async updateSpecialization(specialization: string) {
        const tx =
            await this.contract.updateSpecialization(specialization);

        return await tx.wait();
    }

    async totalDoctors() {
        return await this.contract.totalDoctors();
    }
}
