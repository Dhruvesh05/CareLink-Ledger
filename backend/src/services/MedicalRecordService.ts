import { randomInt } from "crypto";
import { IBlockchainProvider } from "../blockchain/provider/IBlockchainProvider";

import {
    IPFSService
} from "./ipfs/IPFSService";

import {
    sha256FromBuffer,
    verifySha256
} from "../utils/hash";

import MedicalRecordModel
    from "../models/MedicalRecordModel";
import {
    KeyManagement,
    keyManagementService as defaultKeyManagementService
} from "./encryption/KeyManagementService";
import {
    MedicalRecordEncryptionMetadata,
    MedicalRecordEncryptionService
} from "./encryption/MedicalRecordEncryptionService";

export type MedicalRecordAccessContext = {
    walletAddress: string;
    role: "Admin" | "Patient" | "Doctor" | "Hospital";
};

export type MedicalRecordChainScope = {
    chainId: number;
    contractAddress: string;
};

function createStorageRecordId(): number {
    return Date.now() * 1000 + randomInt(0, 1000);
}

export class MedicalRecordService {

    private readonly blockchainService:
        IBlockchainProvider;

    private readonly ipfsService:
        IPFSService;

    private readonly keyManagementService:
        KeyManagement;

    private readonly encryptionService:
        MedicalRecordEncryptionService;

    private readonly recordScope?: MedicalRecordChainScope;

    constructor(
        ipfsService: IPFSService,
        blockchainService: IBlockchainProvider,
        keyManagementService:
            KeyManagement =
                defaultKeyManagementService,
        encryptionService:
            MedicalRecordEncryptionService =
                new MedicalRecordEncryptionService(),
        recordScope?: MedicalRecordChainScope
    ) {

        this.blockchainService =
            blockchainService;

        this.ipfsService =
            ipfsService;

        this.keyManagementService =
            keyManagementService;

        this.encryptionService =
            encryptionService;

        this.recordScope = recordScope;
    }

    private getCurrentRecordScope():
        { chainId: number; contractAddress: string } | undefined {
        if (this.recordScope) {
            return {
                chainId: this.recordScope.chainId,
                contractAddress: this.recordScope.contractAddress.toLowerCase()
            };
        }

        if (process.env.BLOCKCHAIN_PROVIDER?.toLowerCase() !== "polygon") {
            return undefined;
        }

        const network = (process.env.POLYGON_NETWORK || "amoy").toLowerCase();
        const chainId =
            network === "amoy" ? 80002 :
            network === "polygon" || network === "mainnet" ? 137 :
            undefined;

        const contractAddress =
            process.env.POLYGON_MEDICAL_RECORD_ADDRESS?.trim().toLowerCase();

        if (!chainId || !contractAddress) {
            return undefined;
        }

        return { chainId, contractAddress };
    }

    private getScopedRecordFilter(recordId: number) {
        return {
            recordId,
            ...(this.getCurrentRecordScope() ?? {})
        };
    }

    private getEncryptionMetadata(
        metadata: any
    ): MedicalRecordEncryptionMetadata {
        if (!metadata) {
            throw new Error(
                "Medical record encryption metadata is unavailable"
            );
        }

        const encryptionMetadata = {
            version: metadata.encryptionVersion,
            algorithm: metadata.encryptionAlgorithm,
            iv: metadata.encryptionIv,
            authTag: metadata.encryptionAuthTag,
            keyReference: metadata.encryptionKeyReference
        } as MedicalRecordEncryptionMetadata;

        if (
            encryptionMetadata.version === undefined ||
            !encryptionMetadata.algorithm ||
            !encryptionMetadata.iv ||
            !encryptionMetadata.authTag ||
            !encryptionMetadata.keyReference
        ) {
            throw new Error(
                "Medical record encryption metadata is unavailable"
            );
        }

        return encryptionMetadata;
    }

    /*
    ==========================================================
    CREATE
    ==========================================================
    */

    async createMedicalRecord(
        patient: string,
        file: Express.Multer.File,
        category: string,
        emergency: boolean
    ) {

        if (!file?.buffer?.length) {
            throw new Error(
                "Medical record file is required"
            );
        }



        const fileName =
            file.originalname?.trim() ||
            "medical-record";

        const mimeType =
            file.mimetype?.trim() ||
            "application/octet-stream";

        const fileSize =
            file.buffer.length;

        /*
         * Calculate SHA-256 from the exact bytes
         * that will be uploaded to IPFS.
         */
        const managedKey =
            await this.keyManagementService.createKey();

        const encrypted =
            this.encryptionService.encrypt(
                file.buffer,
                managedKey.key,
                managedKey.reference
            );

        const fileHash =
            sha256FromBuffer(
                encrypted.ciphertext
            );
        const plaintextHash =
            sha256FromBuffer(file.buffer);

        /*
         * ------------------------------------------------------
         * STEP 1: Upload to IPFS
         * ------------------------------------------------------
         */
        const uploadResult =
            await this.ipfsService.uploadFile(
                encrypted.ciphertext,
                fileName,
                mimeType
            );

        const cid =
            uploadResult.cid;

        let blockchainCommitted =
            false;

        let recordId:
            number | null = null;

        /*
         * ------------------------------------------------------
         * STEP 2: Create blockchain record
         * ------------------------------------------------------
         */
        try {

            const transaction =
                await this.blockchainService
                    .createMedicalRecord(
                        patient,
                        cid,
                        fileHash,
                        category,
                        emergency
                    );

            recordId =
                Number(
                    transaction?.recordId ?? 0
                );

            if (
                !Number.isInteger(recordId) ||
                recordId <= 0
            ) {
                throw new Error(
                    "Blockchain transaction did not return a valid recordId"
                );
            }

            blockchainCommitted =
                true;

            /*
             * --------------------------------------------------
             * STEP 3: Persist searchable metadata in MongoDB
             * --------------------------------------------------
             */
            try {

                await MedicalRecordModel.create({

                    recordId,

                    ...(this.getCurrentRecordScope() ?? {}),

                    patientWallet:
                        patient,

                    fileName,

                    mimeType,

                    fileSize,

                    fileHash,

                    plaintextHash,

                    cid,

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

                    category,

                    emergency,

                    transactionHash:
                        transaction?.transactionHash ||
                        transaction?.hash ||
                        undefined
                });

            } catch (mongoError) {

                /*
                 * Blockchain already references the CID.
                 *
                 * NEVER unpin the CID here because doing so would
                 * leave an on-chain record pointing to unavailable
                 * content.
                 *
                 * Instead, try to deactivate the blockchain record.
                 */
                try {

                    await this.blockchainService
                        .deactivateMedicalRecord(
                            recordId
                        );

                } catch (deactivationError) {

                    /*
                     * Preserve the original MongoDB error.
                     * Deactivation failure is intentionally not
                     * allowed to hide the actual persistence error.
                     */
                    console.error(
                        "Failed to deactivate medical record after MongoDB persistence failure",
                        deactivationError
                    );
                }

                throw mongoError;
            }

            return transaction;

        } catch (error) {

            /*
             * If blockchain creation never committed,
             * the CID is not referenced by a medical record.
             *
             * It is therefore safe to remove its pin.
             */
            if (
                !blockchainCommitted
            ) {

                try {

                    await this.ipfsService
                        .unpinFile(cid);

                } catch (cleanupError) {

                    /*
                     * Cleanup failure must not hide the original
                     * blockchain error.
                     */
                    console.error(
                        "Failed to clean up IPFS pin after blockchain failure",
                        cleanupError
                    );
                }
            }

            throw error;
        }
    }

    async createPatientStorageRecord(
        patientWallet: string,
        patientUserId: string,
        file: Express.Multer.File,
        category: string,
        emergency: boolean
    ) {
        if (!file?.buffer?.length) {
            throw new Error("Medical record file is required");
        }
        const fileName = file.originalname?.trim() || "medical-record";
        const mimeType = file.mimetype?.trim() || "application/octet-stream";
        const managedKey = await this.keyManagementService.createKey();
        const encrypted = this.encryptionService.encrypt(file.buffer, managedKey.key, managedKey.reference);
        const fileHash = sha256FromBuffer(encrypted.ciphertext);
        const plaintextHash = sha256FromBuffer(file.buffer);
        const cid = (await this.ipfsService.uploadFile(encrypted.ciphertext, fileName, mimeType)).cid;
        const recordId = createStorageRecordId();
        try {
            await MedicalRecordModel.create({
                recordId,
                recordType: "storage",
                blockchainStatus: "not_anchored",
                patientWallet: patientWallet.toLowerCase(),
                patientUserId,
                fileName,
                mimeType,
                fileSize: file.buffer.length,
                fileHash,
                plaintextHash,
                cid,
                encryptionVersion: encrypted.metadata.version,
                encryptionAlgorithm: encrypted.metadata.algorithm,
                encryptionIv: encrypted.metadata.iv,
                encryptionAuthTag: encrypted.metadata.authTag,
                encryptionKeyReference: encrypted.metadata.keyReference,
                category,
                emergency
            });
        } catch (error) {
            try {
                await this.ipfsService.unpinFile(cid);
            } catch (cleanupError) {
                console.error("Failed to clean up Patient upload after metadata failure", cleanupError);
            }
            throw error;
        }
        return {
            recordId,
            patientWallet: patientWallet.toLowerCase(),
            patientUserId,
            cid,
            fileHash,
            plaintextHash,
            fileName,
            mimeType,
            fileSize: file.buffer.length,
            category,
            emergency,
            blockchainStatus: "not_anchored" as const
        };
    }

    /*
    ==========================================================
    GET
    ==========================================================
    */

    async getMedicalRecord(
        recordId: number,
        caller?: string
    ) {

        if (caller === undefined) {
            return this.blockchainService
                .getMedicalRecord(recordId);
        }

        return this.blockchainService
            .getMedicalRecord(
                recordId,
                caller
            );
    }

    async getMedicalRecordContent(
        recordId: number,
        accessContext?: MedicalRecordAccessContext
    ) {

        let metadata = await MedicalRecordModel.findOne(this.getScopedRecordFilter(recordId));
        const record = metadata?.recordType === "storage"
            ? {
                ...metadata.toObject(),
                patient: metadata.patientWallet,
                cid: metadata.cid,
                active: true
            }
            : await this.getMedicalRecord(recordId);

        if (accessContext) {
            await this.assertRecordAccess(
                recordId,
                record,
                accessContext
            );
        }

        const cid =
            String(
                record?.ipfsHash ??
                record?.cid ??
                ""
            ).trim();

        if (!cid) {
            throw new Error(
                "Medical record CID is missing"
            );
        }

        const fileHash =
            String(
                record?.fileHash ??
                metadata?.fileHash ??
                ""
            ).trim();

        if (!/^[a-f0-9]{64}$/i.test(fileHash)) {
            throw new Error(
                "Medical record file hash is missing or invalid"
            );
        }

        const hasEncryptionMetadata = (candidate: any): boolean =>
            Boolean(
                candidate &&
                candidate.encryptionVersion !== undefined &&
                candidate.encryptionVersion !== null &&
                candidate.encryptionAlgorithm &&
                candidate.encryptionIv &&
                candidate.encryptionAuthTag &&
                candidate.encryptionKeyReference
            );

        /*
         * A bridged record can have its CID and file hash on the
         * destination chain while its encryption metadata remains
         * associated with the original record in MongoDB.
         *
         * Reuse metadata only for the exact same encrypted content.
         * The record access check above and file integrity check below
         * remain in place.
         */
        if (!hasEncryptionMetadata(metadata)) {
            const sharedContentMetadata =
                await MedicalRecordModel.findOne({
                    cid,
                    fileHash,
                    encryptionVersion: {
                        $exists: true,
                        $ne: null
                    },
                    encryptionAlgorithm: {
                        $exists: true,
                        $nin: ["", null]
                    },
                    encryptionIv: {
                        $exists: true,
                        $nin: ["", null]
                    },
                    encryptionAuthTag: {
                        $exists: true,
                        $nin: ["", null]
                    },
                    encryptionKeyReference: {
                        $exists: true,
                        $nin: ["", null]
                    }
                });

            if (sharedContentMetadata) {
                metadata = sharedContentMetadata;
            }
        }

        const content =
            await this.ipfsService
                .downloadFile(cid);

        if (!verifySha256(content, fileHash)) {
            throw new Error(
                "Medical record content integrity verification failed"
            );
        }

        const encryptionMetadata =
            this.getEncryptionMetadata(metadata);

        const key =
            await this.keyManagementService
                .getKey(
                    encryptionMetadata.keyReference
                );

        const decryptedContent =
            this.encryptionService.decrypt(
                content,
                key,
                encryptionMetadata
            );

        if (
            metadata?.plaintextHash &&
            !verifySha256(
                decryptedContent,
                metadata.plaintextHash
            )
        ) {
            throw new Error(
                "Medical record plaintext integrity verification failed"
            );
        }

        return {
            content: decryptedContent,
            cid,
            fileHash,
            record,
            ...(metadata
                ? {
                      fileName:
                          metadata.fileName,
                      mimeType:
                          metadata.mimeType,
                      fileSize:
                          metadata.fileSize
                  }
                : {})
        };
    }


    /**
     * Retrieves content referenced by a Fabric ledger record.
     * The Fabric route must authorize the caller before invoking this method.
     */
    async createFabricMedicalRecord(input: {
        patientId: string;
        patientWallet: string;
        patientUserId?: string;
        doctorId: string;
        hospitalId: string;
        file: Express.Multer.File;
        category: string;
        emergency: boolean;
    }) {
        const {
            patientId,
            patientWallet,
            doctorId,
            hospitalId,
            file,
            category,
            emergency
        } = input;

        if (!file?.buffer?.length) {
            throw new Error("Medical record file is required.");
        }

        if (!patientId || !doctorId || !hospitalId) {
            throw new Error(
                "Fabric patient, doctor, and hospital identities are required."
            );
        }

        const normalizedCategory = category.trim();
        if (!normalizedCategory) {
            throw new Error("Medical record category is required.");
        }

        const fileName = file.originalname?.trim() || "medical-record";
        const mimeType = file.mimetype?.trim() || "application/octet-stream";
        const fileSize = file.buffer.length;

        const managedKey = await this.keyManagementService.createKey();
        const encrypted = this.encryptionService.encrypt(
            file.buffer,
            managedKey.key,
            managedKey.reference
        );

        const fileHash = sha256FromBuffer(encrypted.ciphertext);
        const plaintextHash = sha256FromBuffer(file.buffer);
        const uploadResult = await this.ipfsService.uploadFile(
            encrypted.ciphertext,
            fileName,
            mimeType
        );
        const cid = uploadResult.cid;

        // Keep the Fabric ID numeric-compatible because the EVM bridge accepts
        // uint256 source IDs. A random safe integer avoids reusing low test IDs.
        const recordId = randomInt(1_000_000_000_000, 9_000_000_000_000);
        let blockchainCommitted = false;

        try {
            const creator = (
                this.blockchainService as IBlockchainProvider & {
                    createNativeMedicalRecord?: (
                        ...args: any[]
                    ) => Promise<any>;
                }
            ).createNativeMedicalRecord;

            if (typeof creator !== "function") {
                throw new Error(
                    "Fabric-native record creation is unavailable on this provider."
                );
            }

            const transaction = await creator.call(
                this.blockchainService,
                String(recordId),
                patientId,
                doctorId,
                hospitalId,
                cid,
                fileHash,
                normalizedCategory,
                emergency
            );

            blockchainCommitted = true;

            // Persist the encryption key reference and integrity metadata.
            // Content retrieval uses the exact CID + encrypted-file hash.
            await MedicalRecordModel.create({
                recordId,
                patientWallet: patientWallet.toLowerCase(),
                patientUserId: input.patientUserId,
                fileName,
                mimeType,
                fileSize,
                fileHash,
                plaintextHash,
                cid,
                encryptionVersion: encrypted.metadata.version,
                encryptionAlgorithm: encrypted.metadata.algorithm,
                encryptionIv: encrypted.metadata.iv,
                encryptionAuthTag: encrypted.metadata.authTag,
                encryptionKeyReference: encrypted.metadata.keyReference,
                category: normalizedCategory,
                emergency,
                transactionHash: transaction?.transactionId || undefined
            });

            return {
                recordId,
                transactionId: transaction?.transactionId,
                cid,
                fileHash,
                fileName,
                mimeType,
                fileSize,
                category: normalizedCategory,
                emergency
            };
        } catch (error) {
            // Once committed on Fabric, never unpin content referenced by ledger.
            if (!blockchainCommitted) {
                try {
                    await this.ipfsService.unpinFile(cid);
                } catch (cleanupError) {
                    console.error(
                        "Failed to unpin Fabric upload after creation failure",
                        cleanupError
                    );
                }
            }

            throw error;
        }
    }

    async getMedicalRecordContentFromLedgerRecord(record: any) {
        const active = record?.active ?? record?.Active;

        if (active !== true) {
            throw new Error("InactiveRecord");
        }

        const cid = String(
            record?.ipfsHash ?? record?.cid ?? record?.CID ?? ""
        ).trim();

        const fileHash = String(
            record?.fileHash ?? record?.FileHash ?? ""
        ).trim();

        if (!cid) {
            throw new Error("Medical record CID is missing");
        }

        if (!/^[a-f0-9]{64}$/i.test(fileHash)) {
            throw new Error("Medical record file hash is missing or invalid");
        }

        // Match encryption metadata only to this exact encrypted content.
        const metadata = await MedicalRecordModel.findOne({
            cid,
            fileHash: new RegExp(`^${fileHash}$`, "i"),
            encryptionVersion: { $exists: true, $ne: null },
            encryptionAlgorithm: { $exists: true, $nin: ["", null] },
            encryptionIv: { $exists: true, $nin: ["", null] },
            encryptionAuthTag: { $exists: true, $nin: ["", null] },
            encryptionKeyReference: { $exists: true, $nin: ["", null] }
        });

        if (!metadata) {
            throw new Error(
                "Medical record encryption metadata is unavailable for this CID and file hash"
            );
        }

        const encryptedContent = await this.ipfsService.downloadFile(cid);

        if (!verifySha256(encryptedContent, fileHash)) {
            throw new Error("Medical record content integrity verification failed");
        }

        const encryptionMetadata = this.getEncryptionMetadata(metadata);

        const key = await this.keyManagementService.getKey(
            encryptionMetadata.keyReference
        );

        const decryptedContent = this.encryptionService.decrypt(
            encryptedContent,
            key,
            encryptionMetadata
        );

        if (
            metadata.plaintextHash &&
            !verifySha256(
                decryptedContent,
                metadata.plaintextHash
            )
        ) {
            throw new Error(
                "Medical record plaintext integrity verification failed"
            );
        }

        return {
            content: decryptedContent,
            cid,
            fileHash,
            record,
            fileName: metadata.fileName,
            mimeType: metadata.mimeType,
            fileSize: metadata.fileSize
        };
    }

    private async assertRecordAccess(
        recordId: number,
        record: any,
        accessContext: MedicalRecordAccessContext
    ): Promise<void> {
        const active =
            record?.active ??
            record?.[10];

        if (active !== true) {
            throw new Error("InactiveRecord");
        }

        const wallet =
            accessContext.walletAddress.trim().toLowerCase();
        const patient =
            this.getRecordAddress(record, "patient", 1);
        const doctor =
            this.getRecordAddress(record, "doctor", 2);
        const hospital =
            this.getRecordAddress(record, "hospital", 3);

        if (
            accessContext.role === "Admin" ||
            (accessContext.role === "Patient" && wallet === patient) ||
            (accessContext.role === "Doctor" && wallet === doctor) ||
            (accessContext.role === "Hospital" && wallet === hospital)
        ) {
            return;
        }

        if (accessContext.role === "Doctor") {
            const granted =
                await this.blockchainService.isAuthorizedDoctor(
                    recordId,
                    accessContext.walletAddress
                );

            if (granted === true) {
                return;
            }
        }

        throw new Error("Unauthorized");
    }

    private getRecordAddress(
        record: any,
        name: string,
        index: number
    ): string {
        return String(
            record?.[name] ??
            record?.[index] ??
            ""
        ).trim().toLowerCase();
    }

    /*
    ==========================================================
    UPDATE
    ==========================================================
    */

    async updateMedicalRecord(
        recordId: number,
        file: Express.Multer.File,
        category: string,
        expectedVersion: number
    ) {

        if (!file?.buffer?.length) {
            throw new Error(
                "Medical record file is required"
            );
        }

        const fileName =
            file.originalname?.trim() ||
            "medical-record";

        const mimeType =
            file.mimetype?.trim() ||
            "application/octet-stream";

        const fileSize =
            file.buffer.length;

        const managedKey =
            await this.keyManagementService.createKey();

        const encrypted =
            this.encryptionService.encrypt(
                file.buffer,
                managedKey.key,
                managedKey.reference
            );

        const fileHash =
            sha256FromBuffer(
                encrypted.ciphertext
            );
        const plaintextHash =
            sha256FromBuffer(file.buffer);

        /*
         * Upload the replacement file first.
         *
         * The new CID is pinned automatically by the IPFS layer.
         */
        const uploadResult =
            await this.ipfsService.uploadFile(
                encrypted.ciphertext,
                fileName,
                mimeType
            );

        const cid =
            uploadResult.cid;

        let blockchainCommitted =
            false;

        /*
         * ------------------------------------------------------
         * Update blockchain
         * ------------------------------------------------------
         */
        try {

            const transaction =
                await this.blockchainService
                    .updateMedicalRecord(
                        recordId,
                        cid,
                        fileHash,
                        category,
                        expectedVersion
                    );

            blockchainCommitted =
                true;

            /*
             * --------------------------------------------------
             * Update MongoDB metadata
             * --------------------------------------------------
             */
            try {

                const existing = await MedicalRecordModel.findOne(this.getScopedRecordFilter(recordId));

                if (existing) {

                    await MedicalRecordModel.updateOne(this.getScopedRecordFilter(recordId),

                        {
                            $set: {

                                patientWallet:
                                    existing.patientWallet,

                                fileName,

                                mimeType,

                                fileSize,

                                fileHash,

                                plaintextHash,

                                cid,

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

                                category,

                                emergency:
                                    existing.emergency,

                                transactionHash:
                                    transaction?.transactionHash ||
                                    transaction?.hash ||
                                    existing.transactionHash
                            }
                        }
                    );

                } else {

                    /*
                     * Blockchain already succeeded but MongoDB
                     * has no metadata entry.
                     *
                     * Create it from the existing blockchain
                     * context we already have.
                     */
                    throw new Error(
                        "Medical record metadata not found in MongoDB"
                    );
                }

            } catch (mongoError) {

                /*
                 * DO NOT unpin the new CID.
                 *
                 * The blockchain already references it.
                 */
                console.error(
                    "Medical record blockchain update succeeded but MongoDB update failed",
                    mongoError
                );

                throw mongoError;
            }

            return transaction;

        } catch (error) {

            /*
             * If blockchain update failed, the new CID is not
             * referenced by the blockchain record.
             *
             * It is safe to remove its pin.
             */
            if (
                !blockchainCommitted
            ) {

                try {

                    await this.ipfsService
                        .unpinFile(cid);

                } catch (cleanupError) {

                    console.error(
                        "Failed to clean up replacement IPFS pin after blockchain update failure",
                        cleanupError
                    );
                }
            }

            throw error;
        }
    }

    /*
    ==========================================================
    DEACTIVATE
    ==========================================================
    */

    async deactivateMedicalRecord(
        recordId: number
    ) {

        return this.blockchainService
            .deactivateMedicalRecord(
                recordId
            );
    }

    /*
    ==========================================================
    ACCESS CONTROL
    ==========================================================
    */

    async grantAccess(
        recordId: number,
        doctor: string
    ) {

        return this.blockchainService
            .grantAccess(
                recordId,
                doctor
            );
    }

    async revokeAccess(
        recordId: number,
        doctor: string
    ) {

        return this.blockchainService
            .revokeAccess(
                recordId,
                doctor
            );
    }

    async isAuthorizedDoctor(
        recordId: number,
        doctor: string
    ) {

        return this.blockchainService
            .isAuthorizedDoctor(
                recordId,
                doctor
            );
    }

    /*
    ==========================================================
    RECORD VIEWS
    ==========================================================
    */

    async viewRecord(
        recordId: number
    ) {

        return this.blockchainService
            .viewRecord(
                recordId
            );
    }

    private async hydrateMedicalRecordIds(
        recordIds: any[],
        caller?: string
    ): Promise<any[]> {

        const ids =
            Array.from(recordIds ?? [])
                .map((id) => Number(id))
                .filter(
                    (id) =>
                        Number.isSafeInteger(id) &&
                        id > 0
                );

        if (!ids.length) {
            return [];
        }

        const [chainRecords, mongoRecords] =
            await Promise.all([
                Promise.all(
                    ids.map((id) =>
                        this.blockchainService
                            .getMedicalRecord(
                                id,
                                caller
                            )
                    )
                ),
                MedicalRecordModel.find({ recordId: { $in: ids }, ...(this.getCurrentRecordScope() ?? {}) })
                    .lean()
            ]);

        const mongoById =
            new Map(
                mongoRecords.map(
                    (record) => [
                        record.recordId,
                        record
                    ]
                )
            );

        const field = (
            record: any,
            index: number,
            name: string
        ) =>
            record?.[name] ??
            record?.[index];

        const toIso = (value: any) => {

            const seconds =
                Number(value);

            if (
                !Number.isFinite(seconds) ||
                seconds <= 0
            ) {
                return undefined;
            }

            return new Date(
                seconds * 1000
            ).toISOString();
        };

        return chainRecords.map(
            (record: any) => {

                const recordId =
                    Number(
                        field(
                            record,
                            0,
                            "recordId"
                        )
                    );

                const createdAt =
                    toIso(
                        field(
                            record,
                            7,
                            "createdAt"
                        )
                    );

                const updatedAt =
                    toIso(
                        field(
                            record,
                            8,
                            "updatedAt"
                        )
                    );

                const mongo =
                    mongoById.get(recordId);

                return {
                    recordId,

                    patientWallet:
                        String(
                            field(
                                record,
                                1,
                                "patient"
                            )
                        ),

                    doctorWallet:
                        String(
                            field(
                                record,
                                2,
                                "doctor"
                            )
                        ),

                    hospitalWallet:
                        String(
                            field(
                                record,
                                3,
                                "hospital"
                            )
                        ),

                    cid:
                        String(
                            field(
                                record,
                                4,
                                "ipfsHash"
                            )
                        ),

                    fileHash:
                        String(
                            field(
                                record,
                                5,
                                "fileHash"
                            )
                        ),

                    category:
                        String(
                            field(
                                record,
                                6,
                                "category"
                            )
                        ),

                    createdAt,
                    timestamp:
                        createdAt,

                    updatedAt,

                    status:
                        Boolean(
                            field(
                                record,
                                10,
                                "active"
                            )
                        )
                            ? "Active"
                            : "Inactive",

                    emergency:
                        Boolean(
                            field(
                                record,
                                11,
                                "emergency"
                            )
                        ),

                    fileName:
                        mongo?.fileName,

                    mimeType:
                        mongo?.mimeType,

                    fileSize:
                        mongo?.fileSize,

                    transactionHash:
                        mongo?.transactionHash
                };
            }
        );
    }

    async getPatientRecords(
        patient: string,
        caller?: string
    ) {

        let blockchainRecords: any[] = [];
        try {
            const recordIds = await this.blockchainService.getPatientRecords(patient, caller);
            blockchainRecords = await this.hydrateMedicalRecordIds(recordIds, caller);
        } catch (error) {
            console.warn("Unable to load blockchain patient records; returning storage records", error instanceof Error ? error.message : "unknown error");
        }
        const storageRecords = await MedicalRecordModel.find({
            patientWallet: patient.toLowerCase(),
            recordType: "storage",
            ...(this.getCurrentRecordScope() ?? {})
        }).sort({ createdAt: -1 }).lean();
        return [
            ...storageRecords.map((record) => ({
                recordId: record.recordId,
                patientWallet: record.patientWallet,
                patientUserId: record.patientUserId,
                cid: record.cid,
                fileHash: record.fileHash,
                plaintextHash: record.plaintextHash,
                fileName: record.fileName,
                mimeType: record.mimeType,
                fileSize: record.fileSize,
                category: record.category,
                emergency: record.emergency,
                createdAt: record.createdAt,
                timestamp: record.createdAt,
                status: "Not anchored on blockchain",
                blockchainStatus: record.blockchainStatus,
                fhirProcessingId: record.fhirProcessingId,
                fhirStatus: record.fhirStatus
            })),
            ...blockchainRecords
        ];
    }

    async getDoctorRecords(
        doctor: string,
        caller?: string
    ) {

        const recordIds =
            await this.blockchainService
                .getDoctorRecords(
                    doctor,
                    caller
                );

        return this.hydrateMedicalRecordIds(
            recordIds,
            caller
        );
    }

    async getHospitalRecords(
        hospital: string,
        caller?: string
    ) {

        const recordIds =
            await this.blockchainService
                .getHospitalRecords(
                    hospital,
                    caller
                );

        return this.hydrateMedicalRecordIds(
            recordIds,
            caller
        );
    }

    async logDownload(
        recordId: number
    ) {

        return this.blockchainService
            .logDownload(
                recordId
            );
    }

    /*
    ==========================================================
    UTILITIES
    ==========================================================
    */

    async recordExists(
        recordId: number
    ) {

        return this.blockchainService
            .recordExists(
                recordId
            );
    }

    async totalRecords() {

        return this.blockchainService
            .totalRecords();
    }
}