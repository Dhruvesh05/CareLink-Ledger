import mongoose, { Document, Schema } from "mongoose";

export interface IMedicalRecordEncryptionKey extends Document {
    reference: string;
    iv: string;
    encryptedKey: string;
    authTag: string;
    createdAt: Date;
    updatedAt: Date;
}

const MedicalRecordEncryptionKeySchema =
    new Schema<IMedicalRecordEncryptionKey>(
        {
            reference: {
                type: String,
                required: true,
                unique: true,
                trim: true
            },
            iv: {
                type: String,
                required: true
            },
            encryptedKey: {
                type: String,
                required: true
            },
            authTag: {
                type: String,
                required: true
            }
        },
        {
            collection: "medical_record_encryption_keys",
            timestamps: true,
            versionKey: false
        }
    );

export default mongoose.models.MedicalRecordEncryptionKey ||
    mongoose.model<IMedicalRecordEncryptionKey>(
        "MedicalRecordEncryptionKey",
        MedicalRecordEncryptionKeySchema
    );
