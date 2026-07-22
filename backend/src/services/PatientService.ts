import { EthereumPatientService } from "../blockchain/ethereum/services/EthereumPatientService";


export class PatientService {

    private blockchainService: EthereumPatientService;

    constructor() {

        this.blockchainService =
            new EthereumPatientService();

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