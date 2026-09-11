import mongoose, {
    Document,
    Schema
} from "mongoose";

export type CrossChainAuditStatus =
    | "accepted"
    | "relaying"
    | "confirmed"
    | "failed"
    | "duplicate";

export interface ICrossChainAudit
    extends Document {

    messageId: string;

    sourceChain: string;

    destinationChain: string;

    messageType: string;

    nonce: string;

    payloadHash: string;

    status: CrossChainAuditStatus;

    transactionHash?: string;

    destinationTransactionHash?: string;

    logIndex?: number;

    error?: string;

    createdAt: Date;

    updatedAt: Date;
}

const CrossChainAuditSchema =
    new Schema<ICrossChainAudit>(
        {
            messageId: {
                type: String,
                required: true,
                unique: true,
                index: true,
                trim: true
            },

            sourceChain: {
                type: String,
                required: true,
                index: true
            },

            destinationChain: {
                type: String,
                required: true,
                index: true
            },

            messageType: {
                type: String,
                required: true,
                index: true
            },

            nonce: {
                type: String,
                required: true,
                index: true
            },

            payloadHash: {
                type: String,
                required: true,
                index: true
            },

            status: {
                type: String,
                enum: [
                    "accepted",
                    "relaying",
                    "confirmed",
                    "failed",
                    "duplicate"
                ],
                required: true
            },

            transactionHash: {
                type: String,
                required: false,
                index: true
            },

            destinationTransactionHash: {
                type: String,
                required: false,
                index: true
            },

            logIndex: {
                type: Number,
                required: false
            },

            error: {
                type: String,
                required: false
            }
        },
        {
            timestamps: true,
            versionKey: false
        }
    );

export const CrossChainAuditModel =
    mongoose.models.CrossChainAudit ||
    mongoose.model<ICrossChainAudit>(
        "CrossChainAudit",
        CrossChainAuditSchema
    );

export default CrossChainAuditModel;
