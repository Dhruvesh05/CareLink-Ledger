import mongoose, {
    Schema,
    Document
} from "mongoose";

export interface IPreparedMedicalRecord
    extends Document {

    preparationId: string;

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

    chainId: number;
    contractAddress: string;

    status: "prepared" | "confirmed" | "expired";

    transactionHash?: string;
    recordId?: number;

    expiresAt: Date;

    createdAt: Date;
    updatedAt: Date;
}

const PreparedMedicalRecordSchema =
    new Schema<IPreparedMedicalRecord>(
        {
            preparationId: {
                type: String,
                required: true,
                unique: true,
                index: true
            },

            doctorWallet: {
                type: String,
                required: true,
                lowercase: true,
                index: true
            },

            hospitalWallet: {
                type: String,
                required: true,
                lowercase: true
            },

            patientWallet: {
                type: String,
                required: true,
                lowercase: true,
                index: true
            },

            cid: {
                type: String,
                required: true,
                index: true
            },

            fileHash: {
                type: String,
                required: true,
                index: true
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

            category: {
                type: String,
                required: true,
                trim: true
            },

            emergency: {
                type: Boolean,
                required: true
            },

            chainId: {
                type: Number,
                required: true
            },

            contractAddress: {
                type: String,
                required: true,
                lowercase: true
            },

            status: {
                type: String,
                enum: [
                    "prepared",
                    "confirmed",
                    "expired"
                ],
                default: "prepared",
                required: true,
                index: true
            },

            transactionHash: {
                type: String,
                index: true
            },

            recordId: {
                type: Number,
                index: true
            },

            expiresAt: {
                type: Date,
                required: true,
                index: true
            }
        },
        {
            timestamps: true,
            versionKey: false
        }
    );

PreparedMedicalRecordSchema.index({
    doctorWallet: 1,
    status: 1,
    createdAt: -1
});

PreparedMedicalRecordSchema.index({
    expiresAt: 1
}, {
    expireAfterSeconds: 0
});

export const PreparedMedicalRecordModel =
    mongoose.models.PreparedMedicalRecord ||
    mongoose.model<IPreparedMedicalRecord>(
        "PreparedMedicalRecord",
        PreparedMedicalRecordSchema
    );

export default PreparedMedicalRecordModel;
