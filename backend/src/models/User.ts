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
    passwordHash: string;
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

        passwordHash: {
            type: String,
            required: true,
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
