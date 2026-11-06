import mongoose, {
    Document,
    Schema
} from "mongoose";

export interface IEncryptedCredentialReference extends Document {
    userId: string;
    subjectDid: string;
    credentialId: string;
    cid: string;
    encryptedHash: string;
    encryptionVersion: number;
    encryptionAlgorithm: string;
    encryptionIv: string;
    encryptionAuthTag: string;
    encryptionKeyReference: string;
    createdAt: Date;
    updatedAt: Date;
}

const EncryptedCredentialReferenceSchema =
    new Schema<IEncryptedCredentialReference>(
        {
            userId: {
                type: String,
                required: true,
                index: true,
                trim: true
            },
            subjectDid: {
                type: String,
                required: true,
                index: true,
                trim: true
            },
            credentialId: {
                type: String,
                required: true,
                trim: true
            },
            cid: {
                type: String,
                required: true,
                trim: true
            },
            encryptedHash: {
                type: String,
                required: true,
                trim: true
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
                trim: true
            }
        },
        {
            timestamps: true,
            versionKey: false
        }
    );

EncryptedCredentialReferenceSchema.index(
    {
        userId: 1,
        credentialId: 1
    },
    {
        unique: true,
        name: "unique_user_credential_reference"
    }
);

const EncryptedCredentialReferenceModel =
    mongoose.models.EncryptedCredentialReference ||
    mongoose.model<IEncryptedCredentialReference>(
        "EncryptedCredentialReference",
        EncryptedCredentialReferenceSchema
    );

export default EncryptedCredentialReferenceModel;
