import mongoose, {
    Document,
    Schema
} from "mongoose";

export type UserRole =
    | "Admin"
    | "Patient"
    | "Doctor"
    | "Hospital";

export interface IUser extends Document {
    walletAddress: string;
    role: UserRole;
    did?: string;
    passwordHash?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,
            trim: true
        },

        role: {
            type: String,
            enum: [
                "Admin",
                "Patient",
                "Doctor",
                "Hospital"
            ],
            required: true
        },

        did: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
            index: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: false,
            select: false
        },

        active: {
            type: Boolean,
            required: true,
            default: true,
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const UserModel =
    mongoose.models.User ||
    mongoose.model<IUser>(
        "User",
        UserSchema
    );

export default UserModel;
