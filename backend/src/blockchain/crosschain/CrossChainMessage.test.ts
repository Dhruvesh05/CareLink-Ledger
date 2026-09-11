import {
    createCrossChainMessage,
    createPayloadHash,
} from "./CrossChainMessage";
import { BlockchainType } from "../provider/BlockchainType";

describe("CrossChainMessage", () => {
    const payload = {
        recordId: "record-001",
        fileHash: "abc123",
        cid: "bafy-test-cid",
    };

    it("creates a valid cross-chain message", () => {
        const message = createCrossChainMessage({
            messageId: "msg-001",
            sourceChain: BlockchainType.ETHEREUM,
            destinationChain: BlockchainType.POLYGON,
            messageType: "MEDICAL_RECORD_CREATED",
            timestamp: "2026-09-10T12:00:00.000Z",
            nonce: "1",
            payload,
        });

        expect(message.version).toBe("1.0");
        expect(message.messageId).toBe("msg-001");
        expect(message.sourceChain).toBe(BlockchainType.ETHEREUM);
        expect(message.destinationChain).toBe(BlockchainType.POLYGON);
        expect(message.messageType).toBe("MEDICAL_RECORD_CREATED");
        expect(message.payload).toEqual(payload);
        expect(message.payloadHash).toBe(createPayloadHash(payload));
    });

    it("produces a deterministic SHA-256 payload hash", () => {
        const firstHash = createPayloadHash(payload);
        const secondHash = createPayloadHash(payload);

        expect(firstHash).toBe(secondHash);
        expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("changes the payload hash when the payload changes", () => {
        const originalHash = createPayloadHash(payload);

        const modifiedPayload = {
            ...payload,
            fileHash: "different-hash",
        };

        expect(createPayloadHash(modifiedPayload))
            .not.toBe(originalHash);
    });

    it("rejects a missing message ID", () => {
        expect(() =>
            createCrossChainMessage({
                messageId: "   ",
                sourceChain: BlockchainType.ETHEREUM,
                destinationChain: BlockchainType.POLYGON,
                messageType: "MEDICAL_RECORD_CREATED",
                timestamp: "2026-09-10T12:00:00.000Z",
                nonce: "1",
                payload,
            })
        ).toThrow("messageId is required");
    });

    it("rejects a missing message type", () => {
        expect(() =>
            createCrossChainMessage({
                messageId: "msg-001",
                sourceChain: BlockchainType.ETHEREUM,
                destinationChain: BlockchainType.POLYGON,
                messageType: "   ",
                timestamp: "2026-09-10T12:00:00.000Z",
                nonce: "1",
                payload,
            })
        ).toThrow("messageType is required");
    });

    it("rejects a missing timestamp", () => {
        expect(() =>
            createCrossChainMessage({
                messageId: "msg-001",
                sourceChain: BlockchainType.ETHEREUM,
                destinationChain: BlockchainType.POLYGON,
                messageType: "MEDICAL_RECORD_CREATED",
                timestamp: "   ",
                nonce: "1",
                payload,
            })
        ).toThrow("timestamp is required");
    });

    it("rejects a missing nonce", () => {
        expect(() =>
            createCrossChainMessage({
                messageId: "msg-001",
                sourceChain: BlockchainType.ETHEREUM,
                destinationChain: BlockchainType.POLYGON,
                messageType: "MEDICAL_RECORD_CREATED",
                timestamp: "2026-09-10T12:00:00.000Z",
                nonce: "   ",
                payload,
            })
        ).toThrow("nonce is required");
    });
});
