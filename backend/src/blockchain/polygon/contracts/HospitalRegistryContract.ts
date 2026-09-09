import { polygon } from "../config/polygon";

export class HospitalRegistryContract {
    private readonly contract = polygon.hospitalRegistry;

    async registerHospital(
        hospitalNameHash: string,
        registrationNumberHash: string,
        locationHash: string
    ) {
        const tx = await this.contract.registerHospital(
            hospitalNameHash,
            registrationNumberHash,
            locationHash
        );

        return await tx.wait();
    }

    async verifyHospital(wallet: string) {
        const tx = await this.contract.verifyHospital(wallet);
        return await tx.wait();
    }

    async revokeVerification(wallet: string) {
        const tx =
            await this.contract.revokeVerification(wallet);

        return await tx.wait();
    }

    async reactivateHospital(wallet: string) {
        const tx =
            await this.contract.reactivateHospital(wallet);

        return await tx.wait();
    }

    async deactivateHospital() {
        const tx =
            await this.contract.deactivateHospital();

        return await tx.wait();
    }

    async updateLocation(newLocationHash: string) {
        const tx =
            await this.contract.updateLocation(newLocationHash);

        return await tx.wait();
    }

    async getHospital(wallet: string) {
        return await this.contract.getHospital(wallet);
    }

    async isHospitalActive(wallet: string) {
        return await this.contract.isHospitalActive(wallet);
    }

    async isHospitalVerified(wallet: string) {
        return await this.contract.isHospitalVerified(wallet);
    }

    async totalHospitals() {
        return await this.contract.totalHospitals();
    }
}
