import { ethers } from "ethers";

import EthereumMedicalRecordABI
    from "../ethereum/abi/MedicalRecord.json";

import PolygonMedicalRecordABI
    from "../polygon/abi/MedicalRecord.json";
import { getSupportedEvmNetwork } from "../config/supportedNetworks";

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

        const selectedNetwork = getSupportedEvmNetwork(chainId);
        const abi = selectedNetwork.provider === "polygon"
            ? PolygonMedicalRecordABI.abi
            : EthereumMedicalRecordABI.abi;
        const contractAddress = selectedNetwork.medicalRecordAddress;

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
