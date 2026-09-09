import { ethers } from "ethers";

import EthereumMedicalRecordABI
    from "../ethereum/abi/MedicalRecord.json";

import PolygonMedicalRecordABI
    from "../polygon/abi/MedicalRecord.json";

import { BlockchainTransaction } from "./BlockchainTransaction";

export class MedicalRecordTransactionBuilder {

    private readonly provider:
        ethers.JsonRpcProvider;

    constructor(
        provider: ethers.JsonRpcProvider
    ) {
        this.provider = provider;
    }

    async buildCreateMedicalRecordTransaction(
        patient: string,
        ipfsHash: string,
        fileHash: string,
        category: string,
        emergency: boolean
    ): Promise<BlockchainTransaction> {

        if (!ethers.isAddress(patient)) {
            throw new Error(
                "Invalid patient wallet address"
            );
        }

        const network =
            await this.provider.getNetwork();

        const chainId =
            Number(network.chainId);

        let abi: any;
        let contractAddress: string | undefined;

        if (chainId === 80002) {

            abi =
                PolygonMedicalRecordABI.abi;

            contractAddress =
                process.env.POLYGON_MEDICAL_RECORD_ADDRESS;

        } else {

            abi =
                EthereumMedicalRecordABI.abi;

            contractAddress =
                process.env.MEDICAL_RECORD_ADDRESS;
        }

        if (!contractAddress) {
            throw new Error(
                `MedicalRecord contract address is not configured for chain ${chainId}`
            );
        }

        const medicalRecordInterface =
            new ethers.Interface(abi);

        const data =
            medicalRecordInterface.encodeFunctionData(
                "createMedicalRecord",
                [
                    patient,
                    ipfsHash,
                    fileHash,
                    category,
                    emergency
                ]
            );

        return {
            to: contractAddress,
            data,
            chainId,
            value: "0"
        };
    }
}
