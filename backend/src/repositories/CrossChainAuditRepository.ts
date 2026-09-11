import {
    CrossChainAuditModel,
    ICrossChainAudit
} from "../models/CrossChainAudit";

import {
    CrossChainAuditStatus
} from "../models/CrossChainAudit";

export interface CreateCrossChainAuditInput {
    messageId: string;
    sourceChain: string;
    destinationChain: string;
    messageType: string;
    nonce: string;
    payloadHash: string;
    status: CrossChainAuditStatus;
    transactionHash?: string;
    logIndex?: number;
}

export class CrossChainAuditRepository {

    async createIfAbsent(
        input: CreateCrossChainAuditInput
    ): Promise<{
        audit: ICrossChainAudit;
        created: boolean;
    }> {

        const existing =
            await CrossChainAuditModel.findOne({
                messageId: input.messageId
            }).exec();

        if (existing) {
            return {
                audit: existing,
                created: false
            };
        }

        try {
            const audit =
                await CrossChainAuditModel.create(input);

            return {
                audit,
                created: true
            };
        } catch (error: any) {

            if (error?.code === 11000) {
                const duplicate =
                    await CrossChainAuditModel.findOne({
                        messageId: input.messageId
                    }).exec();

                if (duplicate) {
                    return {
                        audit: duplicate,
                        created: false
                    };
                }
            }

            throw error;
        }
    }

    async updateStatus(
        messageId: string,
        status: CrossChainAuditStatus,
        fields: {
            destinationTransactionHash?: string;
            error?: string;
        } = {}
    ): Promise<ICrossChainAudit | null> {

        return await CrossChainAuditModel.findOneAndUpdate(
            { messageId },
            {
                $set: {
                    status,
                    ...fields
                }
            },
            {
                new: true
            }
        ).exec();
    }

    async findByMessageId(
        messageId: string
    ): Promise<ICrossChainAudit | null> {

        return await CrossChainAuditModel.findOne({
            messageId
        }).exec();
    }

    async findByPayloadHash(
        payloadHash: string
    ): Promise<ICrossChainAudit[]> {

        return await CrossChainAuditModel.find({
            payloadHash
        })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByDestinationTransactionHash(
        transactionHash: string
    ): Promise<ICrossChainAudit | null> {

        return await CrossChainAuditModel.findOne({
            destinationTransactionHash: transactionHash
        }).exec();
    }
}
