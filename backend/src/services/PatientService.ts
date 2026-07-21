import { EthereumProvider } from "../blockchain/ethereum/EthereumProvider";
import { BlockchainFactory } from "../blockchain/provider/BlockchainFactory";
import { BlockchainType } from "../blockchain/provider/BlockchainType";


export class PatientService {

    private blockchain = BlockchainFactory.getProvider();
    constructor() {
        this.blockchain = new EthereumProvider();
    }

    async registerPatient(

        fullNameHash: string,

        dobHash: string,

        bloodGroup: string,

        gender: string

    ) {

        return await this.blockchain.registerPatient(

            fullNameHash,

            dobHash,

            bloodGroup,

            gender

        );

    }

    async getPatient(

        patientWallet: string

    ) {

        return await this.blockchain.getPatient(

            patientWallet

        );

    }

    async isPatientActive(

        patientWallet: string

    ) {

        return await this.blockchain.isPatientActive(

            patientWallet

        );

    }

}