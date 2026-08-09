import mongoose, { Schema, Document } from "mongoose";

export interface IMedicalRecord extends Document {
    recordId?: number; // optional cross-reference to on-chain id
    patientWallet: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileHash: string;
    cid: string;
    category: string;
    emergency: boolean;
    transactionHash?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>({
    recordId: { type: Number },
    patientWallet: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileHash: { type: String, required: true },
    cid: { type: String, required: true },
    category: { type: String, required: true },
    emergency: { type: Boolean, required: true },
    transactionHash: { type: String }
}, {
    timestamps: true
});

export const MedicalRecordModel = mongoose.models.MedicalRecord || mongoose.model<IMedicalRecord>(
    "MedicalRecord",
    MedicalRecordSchema
);

export default MedicalRecordModel;
