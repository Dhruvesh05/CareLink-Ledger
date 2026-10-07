import mongoose, {
    Schema,
    Document
} from "mongoose";

export interface IMedicalRecord
    extends Document {

    recordId: number;

    patientWallet: string;

    fileName: string;

    mimeType: string;

    fileSize: number;

    fileHash: string;
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
                required: true,
                unique: true,
                index: true
            },

            patientWallet: {
                type: String,
                required: true,
                index: true,
                lowercase: true
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