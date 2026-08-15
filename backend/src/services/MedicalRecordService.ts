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
         * SHA-256 is calculated from the exact
         * bytes that are uploaded to IPFS.
         */
        const fileHash =
            sha256FromBuffer(file.buffer);

        /*
         * Upload to IPFS first.
         */
        const uploadResult =
            await this.ipfsService.uploadFile(
                file.buffer,
                fileName,
                mimeType
            );

        const cid =
            uploadResult.cid;

        /*
         * Store CID + hash on blockchain.
         */
        const transaction =
            await this.blockchainService
                .createMedicalRecord(
                    patient,
                    cid,
                    fileHash,
                    category,
                    emergency
                );

        const recordId =
            Number(
                transaction?.recordId ?? 0
            );

        if (
            !Number.isInteger(recordId) ||
            recordId <= 0
        ) {
            /*
             * The blockchain transaction succeeded
             * but did not give us a usable record ID.
             */
            throw new Error(
                "Blockchain transaction did not return a valid recordId"
            );
        }

        /*
         * Persist searchable metadata in MongoDB.
         */
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

        return transaction;
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
            .getMedicalRecord(recordId);
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
            sha256FromBuffer(file.buffer);

        /*
         * Upload replacement file.
         */
        const uploadResult =
            await this.ipfsService.uploadFile(
                file.buffer,
                fileName,
                mimeType
            );

        const cid =
            uploadResult.cid;

        /*
         * Update blockchain first.
         */
        const transaction =
            await this.blockchainService
                .updateMedicalRecord(
                    recordId,
                    cid,
                    fileHash,
                    category,
                    expectedVersion
                );

        /*
         * Then update MongoDB metadata.
         */
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
        }

        return transaction;
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
            .viewRecord(recordId);
    }

    async getPatientRecords(
        patient: string
    ) {

        return this.blockchainService
            .getPatientRecords(patient);
    }

    async getDoctorRecords(
        doctor: string
    ) {

        return this.blockchainService
            .getDoctorRecords(doctor);
    }

    async getHospitalRecords(
        hospital: string
    ) {

        return this.blockchainService
            .getHospitalRecords(hospital);
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
            .logDownload(recordId);
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
            .recordExists(recordId);
    }

    async totalRecords() {

        return this.blockchainService
            .totalRecords();
    }
}