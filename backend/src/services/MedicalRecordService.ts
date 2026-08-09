import { EthereumMedicalRecordService } from "../blockchain/ethereum/services/EthereumMedicalRecordService";
import { IPFSService, NotImplementedIPFSService } from "./ipfs/IPFSService";
import { sha256FromBuffer } from "../utils/hash";
import MedicalRecordModel from "../models/MedicalRecordModel";


export class MedicalRecordService {

    private blockchainService: EthereumMedicalRecordService;
    private ipfsService: IPFSService;

    constructor(ipfsService?: IPFSService) {

        this.blockchainService = new EthereumMedicalRecordService();
        this.ipfsService = ipfsService || new NotImplementedIPFSService();

    }

    /*
    ==========================================================
    MEDICAL RECORD
    ==========================================================
    */

    /**
     * Create a medical record by accepting an in-memory file buffer.
     * - computes SHA-256
     * - uploads file buffer to IPFS via IPFSService
     * - calls blockchain service with CID + fileHash
     * - persists metadata to MongoDB
     */
    async createMedicalRecord(
        patient: string,
        file: Express.Multer.File,
        category: string,
        emergency: boolean
    ) {

        // compute SHA-256
        const fileHash = sha256FromBuffer(file.buffer);

        // upload to IPFS
        const uploadResult = await this.ipfsService.uploadFile(
            file.buffer,
            file.originalname || "file",
            file.mimetype || "application/octet-stream"
        );

        const cid = uploadResult.cid;

        // call blockchain
        const tx = await this.blockchainService.createMedicalRecord(
            patient,
            cid,
            fileHash,
            category,
            emergency
        );

        // persist metadata
        try {
            await MedicalRecordModel.create({
                patientWallet: patient,
                fileName: file.originalname || "file",
                mimeType: file.mimetype || "application/octet-stream",
                fileSize: file.size,
                fileHash,
                cid,
                category,
                emergency,
                transactionHash: (tx && tx.hash) || undefined
            });
        }
        catch (err) {
            // Log and continue; do not block blockchain success
            console.error("Failed to persist medical record metadata:", err);
        }

        return tx;

    }

    async getMedicalRecord(
        recordId: number
    ) {

        return await this.blockchainService.getMedicalRecord(recordId);

    }

    /**
     * Update a medical record by uploading a replacement file.
     */
    async updateMedicalRecord(
        recordId: number,
        file: Express.Multer.File,
        category: string,
        expectedVersion: number
    ) {

        const fileHash = sha256FromBuffer(file.buffer);

        const uploadResult = await this.ipfsService.uploadFile(
            file.buffer,
            file.originalname || "file",
            file.mimetype || "application/octet-stream"
        );

        const cid = uploadResult.cid;

        const tx = await this.blockchainService.updateMedicalRecord(
            recordId,
            cid,
            fileHash,
            category,
            expectedVersion
        );

        // persist metadata update
        try {
            await MedicalRecordModel.create({
                recordId,
                patientWallet: "", // unknown here; controller/service could enrich later
                fileName: file.originalname || "file",
                mimeType: file.mimetype || "application/octet-stream",
                fileSize: file.size,
                fileHash,
                cid,
                category,
                emergency: false,
                transactionHash: (tx && tx.hash) || undefined
            });
        }
        catch (err) {
            console.error("Failed to persist medical record metadata (update):", err);
        }

        return tx;

    }

    async deactivateMedicalRecord(
        recordId: number
    ) {

        return await this.blockchainService.deactivateMedicalRecord(
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

        return await this.blockchainService.grantAccess(
            recordId,
            doctor
        );

    }

    async revokeAccess(
        recordId: number,
        doctor: string
    ) {

        return await this.blockchainService.revokeAccess(
            recordId,
            doctor
        );

    }

    async isAuthorizedDoctor(
        recordId: number,
        doctor: string
    ) {

        return await this.blockchainService.isAuthorizedDoctor(
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

        return await this.blockchainService.viewRecord(
            recordId
        );

    }

    async getPatientRecords(
        patient: string
    ) {

        return await this.blockchainService.getPatientRecords(
            patient
        );

    }

    async getDoctorRecords(
        doctor: string
    ) {

        return await this.blockchainService.getDoctorRecords(
            doctor
        );

    }

    async getHospitalRecords(
        hospital: string
    ) {

        return await this.blockchainService.getHospitalRecords(
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

        return await this.blockchainService.logDownload(
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

        return await this.blockchainService.recordExists(
            recordId
        );

    }

    async totalRecords() {

        return await this.blockchainService.totalRecords();

    }

}