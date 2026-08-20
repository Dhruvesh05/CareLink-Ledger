import {
    EthereumMedicalRecordService
} from "../blockchain/ethereum/services/EthereumMedicalRecordService";

import {
    IPFSService
} from "./ipfs/IPFSService";

import {
    sha256FromBuffer
} from "../utils/hash";

import MedicalRecordModel
    from "../models/MedicalRecordModel";

export class MedicalRecordService {

    private readonly blockchainService:
        EthereumMedicalRecordService;

    private readonly ipfsService:
        IPFSService;

    constructor(
        ipfsService: IPFSService
    ) {

        this.blockchainService =
            new EthereumMedicalRecordService();

        this.ipfsService =
            ipfsService;
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
        const fileHash =
            sha256FromBuffer(
                file.buffer
            );

        /*
         * ------------------------------------------------------
         * STEP 1: Upload to IPFS
         * ------------------------------------------------------
         */
        const uploadResult =
            await this.ipfsService.uploadFile(
                file.buffer,
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

                    patientWallet:
                        patient,

                    fileName,

                    mimeType,

                    fileSize,

                    fileHash,

                    cid,

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

    /*
    ==========================================================
    GET
    ==========================================================
    */

    async getMedicalRecord(
        recordId: number
    ) {

        return this.blockchainService
            .getMedicalRecord(
                recordId
            );
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

        const fileHash =
            sha256FromBuffer(
                file.buffer
            );

        /*
         * Upload the replacement file first.
         *
         * The new CID is pinned automatically by the IPFS layer.
         */
        const uploadResult =
            await this.ipfsService.uploadFile(
                file.buffer,
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

                const existing =
                    await MedicalRecordModel.findOne({
                        recordId
                    });

                if (existing) {

                    await MedicalRecordModel.updateOne(
                        { recordId },

                        {
                            $set: {

                                patientWallet:
                                    existing.patientWallet,

                                fileName,

                                mimeType,

                                fileSize,

                                fileHash,

                                cid,

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

    async getPatientRecords(
        patient: string
    ) {

        return this.blockchainService
            .getPatientRecords(
                patient
            );
    }

    async getDoctorRecords(
        doctor: string
    ) {

        return this.blockchainService
            .getDoctorRecords(
                doctor
            );
    }

    async getHospitalRecords(
        hospital: string
    ) {

        return this.blockchainService
            .getHospitalRecords(
                hospital
            );
    }

    /*
    ==========================================================
    AUDIT
    ==========================================================
    */

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