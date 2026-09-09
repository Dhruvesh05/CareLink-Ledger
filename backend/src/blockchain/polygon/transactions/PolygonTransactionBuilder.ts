import { ethers } from "ethers";

import { BlockchainTransaction } from "../../common/BlockchainTransaction";
import MedicalRecordABI from "../abi/MedicalRecord.json";

const medicalRecordInterface =
    new ethers.Interface(MedicalRecordABI.abi);

export class PolygonTransactionBuilder {

    getChainId(): number {
        return 80002;
    }

    buildCreateMedicalRecordTransaction(
        patient: string,
        ipfsHash: string,
        fileHash: string,
        category: string,
        emergency: boolean
    ): BlockchainTransaction {

        if (!ethers.isAddress(patient)) {
            throw new Error(
                "Invalid patient wallet address"
            );
        }

        const medicalRecordAddress =
            process.env.POLYGON_MEDICAL_RECORD_ADDRESS;

        if (!medicalRecordAddress) {
            throw new Error(
                "Missing POLYGON_MEDICAL_RECORD_ADDRESS"
            );
        }

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
            to: medicalRecordAddress,
            data,
            chainId: this.getChainId(),
            value: "0"
        };
    }
}
