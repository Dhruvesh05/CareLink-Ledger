import mongoose, {
    Document,
    Schema
} from "mongoose";

export interface IAuthNonce extends Document {
    walletAddress: string;
    nonce: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AuthNonceSchema = new Schema<IAuthNonce>(
    {
        walletAddress: {
            type: String,
            required: true,
            index: true,
            lowercase: true,
            trim: true
        },

        nonce: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        expiresAt: {
            type: Date,
            required: true
        },

        used: {
            type: Boolean,
            required: true,
            default: false,
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

/*
 * Automatically remove expired authentication challenges.
 */
AuthNonceSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

export const AuthNonceModel =
    mongoose.models.AuthNonce ||
    mongoose.model<IAuthNonce>(
        "AuthNonce",
        AuthNonceSchema
    );

export default AuthNonceModel;
