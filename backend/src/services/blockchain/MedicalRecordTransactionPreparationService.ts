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
    PolygonTransactionBuilder
} from "../../blockchain/polygon/transactions/PolygonTransactionBuilder";

import {
    IBlockchainProvider
} from "../../blockchain/provider/IBlockchainProvider";

import PreparedMedicalRecordModel
    from "../../models/PreparedMedicalRecordModel";

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

    category: string;
    emergency: boolean;
}

export class MedicalRecordTransactionPreparationService {

    private readonly preflightService:
        MedicalRecordPreflightService;

    private readonly transactionBuilder:
        PolygonTransactionBuilder;

    private readonly ipfsService:
        IPFSService;

    private readonly blockchainService:
        IBlockchainProvider;

    constructor(
        ipfsService: IPFSService,
        blockchainService: IBlockchainProvider,
        preflightService:
            MedicalRecordPreflightService =
                new MedicalRecordPreflightService(),
        transactionBuilder:
            PolygonTransactionBuilder =
                new PolygonTransactionBuilder()
    ) {
        this.ipfsService = ipfsService;
        this.blockchainService = blockchainService;
        this.preflightService = preflightService;
        this.transactionBuilder = transactionBuilder;
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
        const fileHash =
            sha256FromBuffer(
                input.file.buffer
            );

        /*
         * Upload and pin the file to IPFS.
         */
        let uploadResult:
            IPFSUploadResult;

        try {
            uploadResult =
                await this.ipfsService.uploadFile(
                    input.file.buffer,
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
            this.transactionBuilder
                .buildCreateMedicalRecordTransaction(
                    patientWallet,
                    uploadResult.cid,
                    fileHash,
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

                fileHash,

                fileName:
                    uploadResult.fileName,

                mimeType:
                    uploadResult.mimeType,

                fileSize:
                    uploadResult.size,

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
            fileHash,

            fileName: uploadResult.fileName,
            mimeType: uploadResult.mimeType,
            fileSize: uploadResult.size,

            category: input.category,
            emergency: input.emergency
        };
    }
}
