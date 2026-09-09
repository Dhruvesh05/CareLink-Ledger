import { ethers } from "ethers";

import { env } from "../../config/env";

import MedicalRecordABI from "../../blockchain/polygon/abi/MedicalRecord.json";

import PreparedMedicalRecordModel from "../../models/PreparedMedicalRecordModel";
import MedicalRecordModel from "../../models/MedicalRecordModel";

export interface ConfirmMedicalRecordInput {
    preparationId: string;
    transactionHash: string;
    doctorWallet: string;
}

export interface ConfirmedMedicalRecord {
    preparationId: string;
    recordId: number;
    transactionHash: string;

    doctorWallet: string;
    hospitalWallet: string;
    patientWallet: string;

    cid: string;
    fileHash: string;

    fileName: string;
    mimeType: string;
    fileSize: number;

    category: string;
    emergency: boolean;
}

export class MedicalRecordTransactionConfirmationService {

    private readonly provider: ethers.JsonRpcProvider;

    private readonly medicalRecordAddress: string;

    private readonly medicalRecordInterface:
        ethers.Interface;

    private readonly medicalRecordContract:
        ethers.Contract;

    constructor(
        provider?: ethers.JsonRpcProvider,
        medicalRecordContract?: ethers.Contract
    ) {
        const rpc =
            env.POLYGON_RPC;

        const contractAddress =
            env.POLYGON_MEDICAL_RECORD_ADDRESS;

        if (!rpc) {
            throw new Error(
                "Polygon RPC is not configured"
            );
        }

        if (!contractAddress) {
            throw new Error(
                "Polygon MedicalRecord contract address is not configured"
            );
        }

        this.provider =
            provider ??
            new ethers.JsonRpcProvider(rpc);

        this.medicalRecordAddress =
            ethers.getAddress(
                contractAddress
            );

        this.medicalRecordInterface =
            new ethers.Interface(
                MedicalRecordABI.abi
            );

        /*
         * IMPORTANT:
         *
         * This contract is connected ONLY to the
         * read-only provider.
         *
         * No PRIVATE_KEY.
         * No signer.
         * No transaction submission.
         */
        this.medicalRecordContract =
            medicalRecordContract ??
            new ethers.Contract(
                this.medicalRecordAddress,
                MedicalRecordABI.abi,
                this.provider
            );
    }

    async confirm(
        input: ConfirmMedicalRecordInput
    ): Promise<ConfirmedMedicalRecord> {

        if (!input.preparationId?.trim()) {
            throw new Error(
                "Preparation ID is required"
            );
        }

        if (!ethers.isAddress(input.doctorWallet)) {
            throw new Error(
                "Invalid doctor wallet address"
            );
        }

        if (!ethers.isHexString(
            input.transactionHash,
            32
        )) {
            throw new Error(
                "Invalid transaction hash"
            );
        }

        const doctorWallet =
            ethers.getAddress(
                input.doctorWallet
            );

        /*
         * ------------------------------------------------------
         * STEP 1: Load preparation
         * ------------------------------------------------------
         */
        const preparation =
            await PreparedMedicalRecordModel.findOne({
                preparationId:
                    input.preparationId,
                doctorWallet:
                    doctorWallet.toLowerCase()
            });

        if (!preparation) {
            throw new Error(
                "Medical record preparation not found"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 2: Prevent replay / duplicate confirmation
         * ------------------------------------------------------
         */
        if (preparation.status !== "prepared") {
            if (
                preparation.status === "confirmed"
            ) {
                throw new Error(
                    "Medical record preparation has already been confirmed"
                );
            }

            throw new Error(
                "Medical record preparation is no longer active"
            );
        }

        /*
         * TTL deletion is asynchronous, therefore expiry
         * must also be checked explicitly.
         */
        if (
            preparation.expiresAt.getTime() <=
            Date.now()
        ) {

            preparation.status =
                "expired";

            await preparation.save();

            throw new Error(
                "Medical record preparation has expired"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 3: Verify Polygon network
         * ------------------------------------------------------
         */
        const network =
            await this.provider.getNetwork();

        if (
            Number(network.chainId) !==
            preparation.chainId
        ) {
            throw new Error(
                "Transaction was submitted on an unexpected blockchain network"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 4: Fetch transaction
         * ------------------------------------------------------
         */
        const transaction =
            await this.provider.getTransaction(
                input.transactionHash
            );

        if (!transaction) {
            throw new Error(
                "Blockchain transaction not found"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 5: Verify transaction destination
         * ------------------------------------------------------
         */
        if (!transaction.to) {
            throw new Error(
                "Transaction has no destination address"
            );
        }

        if (
            transaction.to.toLowerCase() !==
            preparation.contractAddress.toLowerCase()
        ) {
            throw new Error(
                "Transaction destination does not match the prepared MedicalRecord contract"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 6: Verify transaction sender
         * ------------------------------------------------------
         *
         * This is the critical identity check.
         *
         * The blockchain must say that the authenticated
         * doctor actually signed the transaction.
         */
        if (
            transaction.from.toLowerCase() !==
            doctorWallet.toLowerCase()
        ) {
            throw new Error(
                "Transaction sender does not match authenticated doctor"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 7: Decode calldata
         * ------------------------------------------------------
         */
        let decoded:
            ethers.Result;

        try {

            const parsed =
                this.medicalRecordInterface.parseTransaction({
                    data:
                        transaction.data
                });

            if (!parsed) {
                throw new Error(
                    "Unable to decode transaction calldata"
                );
            }

            if (
                parsed.name !==
                "createMedicalRecord"
            ) {
                throw new Error(
                    "Transaction is not a createMedicalRecord call"
                );
            }

            decoded =
                parsed.args;

        } catch {
            throw new Error(
                "Transaction calldata is not a valid createMedicalRecord call"
            );
        }

        const decodedPatient =
            ethers.getAddress(
                String(decoded[0])
            );

        const decodedCid =
            String(decoded[1]);

        const decodedFileHash =
            String(decoded[2]);

        const decodedCategory =
            String(decoded[3]);

        const decodedEmergency =
            Boolean(decoded[4]);

        /*
         * ------------------------------------------------------
         * STEP 8: Compare calldata with preparation
         * ------------------------------------------------------
         */
        if (
            decodedPatient.toLowerCase() !==
            preparation.patientWallet.toLowerCase()
        ) {
            throw new Error(
                "Transaction patient does not match preparation"
            );
        }

        if (
            decodedCid !==
            preparation.cid
        ) {
            throw new Error(
                "Transaction IPFS CID does not match preparation"
            );
        }

        if (
            decodedFileHash !==
            preparation.fileHash
        ) {
            throw new Error(
                "Transaction file hash does not match preparation"
            );
        }

        if (
            decodedCategory !==
            preparation.category
        ) {
            throw new Error(
                "Transaction category does not match preparation"
            );
        }

        if (
            decodedEmergency !==
            preparation.emergency
        ) {
            throw new Error(
                "Transaction emergency flag does not match preparation"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 9: Wait for / fetch receipt
         * ------------------------------------------------------
         */
        const receipt =
            await this.provider.getTransactionReceipt(
                input.transactionHash
            );

        if (!receipt) {
            throw new Error(
                "Transaction has not been mined yet"
            );
        }

        /*
         * status:
         * 1 = successful
         * 0 = reverted
         */
        if (receipt.status !== 1) {
            throw new Error(
                "Medical record blockchain transaction reverted"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 10: Verify RecordCreated event
         * ------------------------------------------------------
         */
        let recordId:
            number | null = null;

        let eventHospital:
            string | null = null;

        let eventPatient:
            string | null = null;

        let eventDoctor:
            string | null = null;

        let eventCategory:
            string | null = null;

        for (const log of receipt.logs) {

            if (
                log.address.toLowerCase() !==
                this.medicalRecordAddress.toLowerCase()
            ) {
                continue;
            }

            try {

                const parsed =
                    this.medicalRecordInterface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });

                if (
                    !parsed ||
                    parsed.name !==
                    "RecordCreated"
                ) {
                    continue;
                }

                recordId =
                    Number(
                        parsed.args[0]
                    );

                eventPatient =
                    ethers.getAddress(
                        String(parsed.args[1])
                    );

                eventDoctor =
                    ethers.getAddress(
                        String(parsed.args[2])
                    );

                eventHospital =
                    ethers.getAddress(
                        String(parsed.args[3])
                    );

                eventCategory =
                    String(parsed.args[4]);

                break;

            } catch {
                continue;
            }
        }

        if (
            recordId === null ||
            !Number.isInteger(recordId) ||
            recordId <= 0
        ) {
            throw new Error(
                "RecordCreated event was not found in transaction receipt"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 11: Verify event identities
         * ------------------------------------------------------
         */
        if (
            !eventDoctor ||
            eventDoctor.toLowerCase() !==
            doctorWallet.toLowerCase()
        ) {
            throw new Error(
                "RecordCreated doctor does not match authenticated doctor"
            );
        }

        if (
            !eventPatient ||
            eventPatient.toLowerCase() !==
            preparation.patientWallet.toLowerCase()
        ) {
            throw new Error(
                "RecordCreated patient does not match preparation"
            );
        }

        if (
            !eventHospital ||
            eventHospital.toLowerCase() !==
            preparation.hospitalWallet.toLowerCase()
        ) {
            throw new Error(
                "RecordCreated hospital does not match preparation"
            );
        }

        if (
            eventCategory !==
            preparation.category
        ) {
            throw new Error(
                "RecordCreated category does not match preparation"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 12: Verify record exists on-chain
         * ------------------------------------------------------
         */
        const exists =
            await this.medicalRecordContract.recordExists(
                recordId
            );

        if (!exists) {
            throw new Error(
                "Confirmed record does not exist on-chain"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 13: Read the actual on-chain record
         * ------------------------------------------------------
         */
        const onChainRecord =
            await this.medicalRecordContract.getMedicalRecord(
                recordId
            );

        /*
         * ------------------------------------------------------
         * STEP 14: Cross-check on-chain record
         * ------------------------------------------------------
         */
        const onChainPatient =
            ethers.getAddress(
                String(onChainRecord.patient)
            );

        const onChainDoctor =
            ethers.getAddress(
                String(onChainRecord.doctor)
            );

        const onChainHospital =
            ethers.getAddress(
                String(onChainRecord.hospital)
            );

        if (
            Number(onChainRecord.recordId) !==
            recordId
        ) {
            throw new Error(
                "On-chain record ID mismatch"
            );
        }

        if (
            onChainPatient.toLowerCase() !==
            preparation.patientWallet.toLowerCase()
        ) {
            throw new Error(
                "On-chain patient does not match preparation"
            );
        }

        if (
            onChainDoctor.toLowerCase() !==
            doctorWallet.toLowerCase()
        ) {
            throw new Error(
                "On-chain doctor does not match authenticated doctor"
            );
        }

        if (
            onChainHospital.toLowerCase() !==
            preparation.hospitalWallet.toLowerCase()
        ) {
            throw new Error(
                "On-chain hospital does not match preparation"
            );
        }

        if (
            String(onChainRecord.ipfsHash) !==
            preparation.cid
        ) {
            throw new Error(
                "On-chain IPFS CID does not match preparation"
            );
        }

        if (
            String(onChainRecord.fileHash) !==
            preparation.fileHash
        ) {
            throw new Error(
                "On-chain file hash does not match preparation"
            );
        }

        if (
            String(onChainRecord.category) !==
            preparation.category
        ) {
            throw new Error(
                "On-chain category does not match preparation"
            );
        }

        if (
            Boolean(onChainRecord.emergency) !==
            preparation.emergency
        ) {
            throw new Error(
                "On-chain emergency flag does not match preparation"
            );
        }

        /*
         * ------------------------------------------------------
         * STEP 15: Persist MongoDB metadata
         * ------------------------------------------------------
         *
         * IMPORTANT:
         *
         * The blockchain transaction has already succeeded.
         * We therefore do NOT deactivate the blockchain record
         * if MongoDB persistence fails.
         */
        try {

            await MedicalRecordModel.create({

                recordId,

                patientWallet:
                    preparation.patientWallet,

                fileName:
                    preparation.fileName,

                mimeType:
                    preparation.mimeType,

                fileSize:
                    preparation.fileSize,

                fileHash:
                    preparation.fileHash,

                cid:
                    preparation.cid,

                category:
                    preparation.category,

                emergency:
                    preparation.emergency,

                transactionHash:
                    input.transactionHash
            });

        } catch (error: any) {

            /*
             * Duplicate MongoDB record can happen if confirmation
             * is retried after a partial persistence success.
             */
            if (
                error?.code === 11000
            ) {
                const existing =
                    await MedicalRecordModel.findOne({
                        recordId
                    });

                if (
                    existing &&
                    existing.transactionHash ===
                    input.transactionHash
                ) {
                    /*
                     * Existing identical persistence is safe.
                     * Continue to mark the preparation confirmed.
                     */
                } else {
                    throw error;
                }
            } else {
                throw error;
            }
        }

        /*
         * ------------------------------------------------------
         * STEP 16: Atomically mark preparation confirmed
         * ------------------------------------------------------
         */
        const confirmed =
            await PreparedMedicalRecordModel.findOneAndUpdate(
                {
                    _id:
                        preparation._id,

                    status:
                        "prepared",

                    expiresAt: {
                        $gt: new Date()
                    }
                },
                {
                    $set: {
                        status:
                            "confirmed",

                        transactionHash:
                            input.transactionHash,

                        recordId
                    }
                },
                {
                    new: true
                }
            );

        if (!confirmed) {

            /*
             * Blockchain and MongoDB are already committed.
             *
             * Do not attempt to reverse the blockchain transaction.
             * A reconciliation/retry mechanism should handle this
             * exceptional race in production.
             */
            throw new Error(
                "Medical record was committed but preparation could not be finalized"
            );
        }

        return {
            preparationId:
                preparation.preparationId,

            recordId,

            transactionHash:
                input.transactionHash,

            doctorWallet,

            hospitalWallet:
                preparation.hospitalWallet,

            patientWallet:
                preparation.patientWallet,

            cid:
                preparation.cid,

            fileHash:
                preparation.fileHash,

            fileName:
                preparation.fileName,

            mimeType:
                preparation.mimeType,

            fileSize:
                preparation.fileSize,

            category:
                preparation.category,

            emergency:
                preparation.emergency
        };
    }
}
