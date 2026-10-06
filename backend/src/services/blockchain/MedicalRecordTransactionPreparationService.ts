import { ethers } from "ethers";
import { randomUUID } from "crypto";

import { env } from "../../config/env";

import {
    IPFSService,
    IPFSUploadResult
} from "../ipfs/IPFSService";

import {
    sha256FromBuffer
} from "../../utils/hash";

import {
    MedicalRecordPreflightService
} from "./MedicalRecordPreflightService";

import {
    MedicalRecordTransactionBuilder
} from "../../blockchain/common/MedicalRecordTransactionBuilder";

import {
    IBlockchainProvider
} from "../../blockchain/provider/IBlockchainProvider";

import PreparedMedicalRecordModel
    from "../../models/PreparedMedicalRecordModel";
import {
    KeyManagement,
    keyManagementService as defaultKeyManagementService
} from "../encryption/KeyManagementService";
import {
    MedicalRecordEncryptionMetadata,
    MedicalRecordEncryptionService
} from "../encryption/MedicalRecordEncryptionService";

export interface PrepareMedicalRecordInput {
    doctorWallet: string;
    patientWallet: string;
    file: Express.Multer.File;
    category: string;
    emergency: boolean;
}

export interface PreparedMedicalRecordTransaction {
    preparationId: string;

    transaction: {
        to: string;
        data: string;
        chainId: number;
        value: string;
    };

    doctorWallet: string;
    hospitalWallet: string;
    patientWallet: string;

    cid: string;
    fileHash: string;

    fileName: string;
    mimeType: string;
    fileSize: number;
    encryption: MedicalRecordEncryptionMetadata;

    category: string;
    emergency: boolean;
}

export class MedicalRecordTransactionPreparationService {

    private readonly preflightService:
        MedicalRecordPreflightService;

    private readonly transactionBuilder:
        MedicalRecordTransactionBuilder;

    private readonly ipfsService:
        IPFSService;

    private readonly blockchainService:
        IBlockchainProvider;

    private readonly keyManagementService:
        KeyManagement;

    private readonly encryptionService:
        MedicalRecordEncryptionService;

    constructor(
        ipfsService: IPFSService,
        blockchainService: IBlockchainProvider,
        preflightService:
            MedicalRecordPreflightService =
                new MedicalRecordPreflightService(),
        transactionBuilder:
            MedicalRecordTransactionBuilder =
                new MedicalRecordTransactionBuilder(
                    new ethers.JsonRpcProvider(
                        process.env.BLOCKCHAIN_PROVIDER?.toLowerCase() === "polygon"
                            ? env.POLYGON_RPC
                            : env.ETHEREUM_RPC
                    )
                ),
        keyManagementService:
            KeyManagement =
                        defaultKeyManagementService,
        encryptionService:
            MedicalRecordEncryptionService =
                new MedicalRecordEncryptionService()
    ) {
        this.ipfsService = ipfsService;
        this.blockchainService = blockchainService;
        this.preflightService = preflightService;
        this.transactionBuilder = transactionBuilder;
        this.keyManagementService = keyManagementService;
        this.encryptionService = encryptionService;
    }

    async prepare(
        input: PrepareMedicalRecordInput
    ): Promise<PreparedMedicalRecordTransaction> {

        if (!ethers.isAddress(input.doctorWallet)) {
            throw new Error(
                "Invalid doctor wallet address"
            );
        }

        if (!ethers.isAddress(input.patientWallet)) {
            throw new Error(
                "Invalid patient wallet address"
            );
        }

        if (!input.file) {
            throw new Error(
                "Medical record file is required"
            );
        }

        const doctorWallet =
            ethers.getAddress(
                input.doctorWallet
            );

        const patientWallet =
            ethers.getAddress(
                input.patientWallet
            );

        /*
         * IMPORTANT:
         *
         * The doctor wallet comes from the authenticated JWT.
         * It is never accepted from the request body.
         *
         * This is read-only blockchain validation.
         */
        const preflight =
            await this.preflightService.validateDoctor(
                doctorWallet
            );

        /*
         * Patient validation is intentionally read-only.
         *
         * The actual createMedicalRecord transaction will still
         * enforce PatientRegistry rules on-chain.
         *
         * This goes through IBlockchainProvider so the preparation
         * service never creates its own RPC/provider dependency.
         */
        const patientActive =
            await this.blockchainService.isPatientActive(
                patientWallet
            );

        if (!patientActive) {
            throw new Error(
                "Patient account is inactive or not registered"
            );
        }

        /*
         * Calculate the exact SHA-256 hash of the uploaded bytes.
         */
        const managedKey =
            await this.keyManagementService.createKey();

        const encrypted =
            this.encryptionService.encrypt(
                input.file.buffer,
                managedKey.key,
                managedKey.reference
            );

        const encryptedFileHash =
            sha256FromBuffer(
                encrypted.ciphertext
            );

        /*
         * Upload and pin the file to IPFS.
         */
        let uploadResult:
            IPFSUploadResult;

        try {
            uploadResult =
                await this.ipfsService.uploadFile(
                    encrypted.ciphertext,
                    input.file.originalname,
                    input.file.mimetype
                );
        } catch (error) {
            throw error;
        }

        /*
         * Build calldata only.
         *
         * No wallet/private key is involved here.
         * No blockchain transaction is submitted.
         */
        const transaction =
            await this.transactionBuilder
                .buildCreateMedicalRecordTransaction(
                    patientWallet,
                    uploadResult.cid,
                    encryptedFileHash,
                    input.category,
                    input.emergency
                );

        /*
         * Create a short-lived server-side preparation record.
         *
         * This binds the authenticated doctor, patient, IPFS CID,
         * file hash and transaction metadata together before the
         * doctor signs the transaction.
         */
        const preparationId =
            randomUUID();

        const expiresAt =
            new Date(
                Date.now() +
                15 * 60 * 1000
            );

        try {

            await PreparedMedicalRecordModel.create({
                preparationId,

                doctorWallet:
                    preflight.doctor,

                hospitalWallet:
                    preflight.hospital,

                patientWallet,

                cid:
                    uploadResult.cid,

                fileHash:
                    encryptedFileHash,

                fileName:
                    uploadResult.fileName,

                mimeType:
                    uploadResult.mimeType,

                fileSize:
                    input.file.buffer.length,

                encryptionVersion:
                    encrypted.metadata.version,

                encryptionAlgorithm:
                    encrypted.metadata.algorithm,

                encryptionIv:
                    encrypted.metadata.iv,

                encryptionAuthTag:
                    encrypted.metadata.authTag,

                encryptionKeyReference:
                    encrypted.metadata.keyReference,

                category:
                    input.category,

                emergency:
                    input.emergency,

                chainId:
                    transaction.chainId,

                contractAddress:
                    transaction.to,

                status:
                    "prepared",

                expiresAt
            });

        } catch (error) {

            /*
             * MongoDB persistence failed after IPFS upload.
             * Remove the orphaned IPFS object.
             */
            try {
                await this.ipfsService.unpinFile(
                    uploadResult.cid
                );
            } catch (cleanupError) {
                console.error(
                    "Failed to unpin IPFS CID after preparation persistence failure:",
                    cleanupError
                );
            }

            throw error;
        }

        return {
            preparationId,

            transaction: {
                to: transaction.to,
                data: transaction.data,
                chainId: transaction.chainId,
                value: transaction.value || "0"
            },

            doctorWallet: preflight.doctor,
            hospitalWallet: preflight.hospital,
            patientWallet,

            cid: uploadResult.cid,
            fileHash: encryptedFileHash,

            fileName: uploadResult.fileName,
            mimeType: uploadResult.mimeType,
            fileSize: input.file.buffer.length,

            category: input.category,
            emergency: input.emergency,
            encryption: encrypted.metadata
        };
    }
}
