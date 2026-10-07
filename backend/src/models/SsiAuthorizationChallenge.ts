import mongoose, {
    Document,
    Schema
} from "mongoose";

export interface ISsiAuthorizationChallenge extends Document {
    userId: string;
    challenge: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SsiAuthorizationChallengeSchema = new Schema<ISsiAuthorizationChallenge>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
            trim: true
        },

        challenge: {
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

SsiAuthorizationChallengeSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

export const SsiAuthorizationChallengeModel =
    mongoose.models.SsiAuthorizationChallenge ||
    mongoose.model<ISsiAuthorizationChallenge>(
        "SsiAuthorizationChallenge",
        SsiAuthorizationChallengeSchema
    );

export default SsiAuthorizationChallengeModel;