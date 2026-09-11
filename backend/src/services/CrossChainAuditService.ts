import {
    CrossChainMessage
} from "../blockchain/crosschain/CrossChainMessage";

import {
    CrossChainAuditRepository
} from "../repositories/CrossChainAuditRepository";

export type CrossChainAuditResult =
    | "accepted"
    | "duplicate";

export class CrossChainAuditService {

    constructor(
        private readonly repository =
            new CrossChainAuditRepository()
    ) {}

    async recordAccepted(
        message: CrossChainMessage
    ): Promise<CrossChainAuditResult> {

        const payload = message.payload as {
            transactionHash?: string;
            logIndex?: number;
        };

        const result =
            await this.repository.createIfAbsent({
                messageId: message.messageId,
                sourceChain: message.sourceChain,
                destinationChain:
                    message.destinationChain,
                messageType: message.messageType,
                nonce: message.nonce,
                payloadHash: message.payloadHash,
                status: "accepted",
                transactionHash:
                    payload.transactionHash,
                logIndex:
                    payload.logIndex
            });

        return result.created
            ? "accepted"
            : "duplicate";
    }

    async markRelaying(
        messageId: string
    ): Promise<void> {

        await this.repository.updateStatus(
            messageId,
            "relaying"
        );
    }

    async markConfirmed(
        messageId: string,
        destinationTransactionHash: string
    ): Promise<void> {

        await this.repository.updateStatus(
            messageId,
            "confirmed",
            {
                destinationTransactionHash
            }
        );
    }

    async markFailed(
        messageId: string,
        error: string
    ): Promise<void> {

        await this.repository.updateStatus(
            messageId,
            "failed",
            {
                error
            }
        );
    }

    async isKnownDestinationTransaction(
        transactionHash: string
    ): Promise<boolean> {

        const audit =
            await this.repository
                .findByDestinationTransactionHash(
                    transactionHash
                );

        return audit !== null;
    }
}
