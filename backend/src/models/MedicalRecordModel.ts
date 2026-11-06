import mongoose, {
    Schema,
    Document
} from "mongoose";

export interface IMedicalRecord
    extends Document {

    recordId: number;
    recordType?: "blockchain" | "storage";
    blockchainStatus?: "anchored" | "not_anchored";
    fhirProcessingId?: string;
    fhirStatus?: "processing" | "completed" | "failed";
    chainId?: number;
    contractAddress?: string;

    patientWallet: string;
    patientUserId?: string;

    fileName: string;

    mimeType: string;

    fileSize: number;

    fileHash: string;
    plaintextHash?: string;
    cid: string;
    encryptionVersion: number;
    encryptionAlgorithm: string;
    encryptionIv: string;
    encryptionAuthTag: string;
    encryptionKeyReference: string;

    category: string;

    emergency: boolean;

    transactionHash?: string;

    createdAt: Date;

    updatedAt: Date;
}

const MedicalRecordSchema =
    new Schema<IMedicalRecord>(
        {
            recordId: {
                type: Number,
                required: true
            },

            recordType: {
                type: String,
                enum: ["blockchain", "storage"],
                default: "blockchain",
                index: true
            },

            blockchainStatus: {
                type: String,
                enum: ["anchored", "not_anchored"],
                default: "anchored",
                index: true
            },

            fhirProcessingId: {
                type: String,
                index: true
            },

            fhirStatus: {
                type: String,
                enum: ["processing", "completed", "failed"]
            },

            chainId: {
                type: Number
            },

            contractAddress: {
                type: String,
                trim: true,
                lowercase: true
            },

            patientWallet: {
                type: String,
                required: true,
                index: true,
                lowercase: true
            },

            patientUserId: {
                type: String,
                index: true,
                trim: true
            },

            fileName: {
                type: String,
                required: true,
                trim: true
            },

            mimeType: {
                type: String,
                required: true,
                trim: true
            },

            fileSize: {
                type: Number,
                required: true,
                min: 1
            },

            fileHash: {
                type: String,
                required: true,
                index: true
            },

            plaintextHash: {
                type: String,
                index: true
            },

            cid: {
                type: String,
                required: true,
                index: true
            },

            encryptionVersion: {
                type: Number,
                required: true
            },

            encryptionAlgorithm: {
                type: String,
                required: true
            },

            encryptionIv: {
                type: String,
                required: true
            },

            encryptionAuthTag: {
                type: String,
                required: true
            },

            encryptionKeyReference: {
                type: String,
                required: true,
                index: true
            },

            category: {
                type: String,
                required: true,
                trim: true
            },

            emergency: {
                type: Boolean,
                required: true,
                index: true
            },

            transactionHash: {
                type: String,
                index: true
            }
        },
        {
            timestamps: true,
            versionKey: false
        }
    );

MedicalRecordSchema.index(
    { chainId: 1, contractAddress: 1, recordId: 1 },
    {
        unique: true,
        name: "chainId_1_contractAddress_1_recordId_1",
        partialFilterExpression: {
            chainId: { $type: "number" },
            contractAddress: { $type: "string" }
        } as any
    }
);

MedicalRecordSchema.index({
    patientWallet: 1,
    createdAt: -1
});

MedicalRecordSchema.index({
    category: 1,
    createdAt: -1
});

export const MedicalRecordModel =
    mongoose.models.MedicalRecord ||
    mongoose.model<IMedicalRecord>(
        "MedicalRecord",
        MedicalRecordSchema
    );

export default MedicalRecordModel;