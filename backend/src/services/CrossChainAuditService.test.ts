import {
    CrossChainAuditService
} from "./CrossChainAuditService";

import {
    createCrossChainMessage
} from "../blockchain/crosschain/CrossChainMessage";

import {
    BlockchainType
} from "../blockchain/provider/BlockchainType";

describe("CrossChainAuditService", () => {

    const createMessage = () =>
        createCrossChainMessage({
            messageId: "audit-msg-001",
            sourceChain: BlockchainType.ETHEREUM,
            destinationChain: BlockchainType.POLYGON,
            messageType: "blockchain.RecordCreated",
            timestamp: "2026-09-10T00:00:00.000Z",
            nonce: "0xtest",
            payload: {
                recordId: "1",
                transactionHash: "0xtxhash",
                logIndex: 3,
            },
        });

    it("records an accepted message", async () => {

        const repository = {
            createIfAbsent: jest.fn()
                .mockResolvedValue({
                    audit: {
                        messageId: "audit-msg-001"
                    },
                    created: true
                }),
        };

        const service =
            new CrossChainAuditService(
                repository as any
            );

        const message = createMessage();

        const result =
            await service.recordAccepted(message);

        expect(result).toBe("accepted");

        expect(
            repository.createIfAbsent
        ).toHaveBeenCalledWith({
            messageId: "audit-msg-001",
            sourceChain:
                BlockchainType.ETHEREUM,
            destinationChain:
                BlockchainType.POLYGON,
            messageType:
                "blockchain.RecordCreated",
            nonce: "0xtest",
            payloadHash:
                message.payloadHash,
            status: "accepted",
            transactionHash: "0xtxhash",
            logIndex: 3,
        });
    });

    it("returns duplicate for an existing message", async () => {

        const repository = {
            createIfAbsent: jest.fn()
                .mockResolvedValue({
                    audit: {
                        messageId: "audit-msg-001"
                    },
                    created: false
                }),
        };

        const service =
            new CrossChainAuditService(
                repository as any
            );

        const result =
            await service.recordAccepted(
                createMessage()
            );

        expect(result).toBe("duplicate");

        expect(
            repository.createIfAbsent
        ).toHaveBeenCalledTimes(1);
    });

    it("preserves the message payload hash", async () => {

        const repository = {
            createIfAbsent: jest.fn()
                .mockResolvedValue({
                    audit: {
                        messageId: "audit-msg-001"
                    },
                    created: true
                }),
        };

        const service =
            new CrossChainAuditService(
                repository as any
            );

        const message = createMessage();

        await service.recordAccepted(message);

        const created =
            repository.createIfAbsent.mock.calls[0][0];

        expect(created.payloadHash).toBe(
            message.payloadHash
        );
    });
});
