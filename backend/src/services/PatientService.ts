import { IBlockchainProvider } from "../blockchain/provider/IBlockchainProvider";

export class PatientService {

    private readonly blockchainService: IBlockchainProvider;

    constructor(
        blockchainService: IBlockchainProvider
    ) {
        this.blockchainService = blockchainService;
    }

    async registerPatient(
        fullNameHash: string,
        dobHash: string,
        bloodGroup: string,
        gender: string
    ) {
        return await this.blockchainService.registerPatient(
            fullNameHash,
            dobHash,
            bloodGroup,
            gender
        );
    }

    async getPatient(
        patientWallet: string
    ) {
        return await this.blockchainService.getPatient(
            patientWallet
        );
    }

    async isPatientActive(
        patientWallet: string
    ) {
        return await this.blockchainService.isPatientActive(
            patientWallet
        );
    }

    async updateBloodGroup(
        newBloodGroup: string
    ) {
        return await this.blockchainService.updateBloodGroup(
            newBloodGroup
        );
    }

    async deactivatePatient() {
        return await this.blockchainService.deactivatePatient();
    }

    async reactivatePatient(
        patientWallet: string
    ) {
        return await this.blockchainService.reactivatePatient(
            patientWallet
        );
    }
}
