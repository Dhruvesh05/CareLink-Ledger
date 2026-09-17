import { polygon } from "../config/polygon";
import { ethers } from "ethers";

export class PatientRegistryContract {
    private readonly contract = polygon.patientRegistry;

    async registerPatient(
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ) {
        const tx = await this.contract.registerPatient(
            fullNameHash,
            dobHash,
            bloodGroup,
            gender
        );

        return await tx.wait();
    }

    async getPatient(wallet: string) {
        return await this.contract.getPatient(wallet);
    }

    async isPatientActive(wallet: string) {
        return await this.contract.isPatientActive(wallet);
    }

    async updateBloodGroup(newBloodGroup: string) {
        const tx = await this.contract.updateBloodGroup(newBloodGroup);
        return await tx.wait();
    }

    async deactivatePatient() {
        const tx = await this.contract.deactivatePatient();
        return await tx.wait();
    }

    async reactivatePatient(wallet: string) {
        const tx = await this.contract.reactivatePatient(wallet);
        return await tx.wait();
    }

    async totalPatients() {
        return await this.contract.totalPatients();
    }

    async registerPatientFromBridge(
        messageId: string,
        wallet: string,
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ): Promise<any> {
        const tx =
            await this.contract.registerPatientFromBridge(
                ethers.id(messageId),
                wallet,
                fullNameHash,
                dobHash,
                bloodGroup,
                gender
            );

        await tx.wait();
        return tx;
    }
}
