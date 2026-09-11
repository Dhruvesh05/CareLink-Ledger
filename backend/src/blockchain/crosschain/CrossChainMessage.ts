import { createHash } from "crypto";
import { BlockchainType } from "../provider/BlockchainType";

export interface CrossChainMessage<T = unknown> {
    messageId: string;
    version: "1.0";
    sourceChain: BlockchainType;
    destinationChain: BlockchainType;
    messageType: string;
    timestamp: string;
    nonce: string;
    payload: T;
    payloadHash: string;
}

export function createPayloadHash(payload: unknown): string {
    const canonicalPayload = JSON.stringify(payload);

    return createHash("sha256")
        .update(canonicalPayload, "utf8")
        .digest("hex");
}

export function createCrossChainMessage<T>(
    message: Omit<CrossChainMessage<T>, "version" | "payloadHash">,
): CrossChainMessage<T> {
    if (!message.messageId.trim()) {
        throw new Error("messageId is required");
    }

    if (!message.messageType.trim()) {
        throw new Error("messageType is required");
    }

    if (!message.timestamp.trim()) {
        throw new Error("timestamp is required");
    }

    if (!message.nonce.trim()) {
        throw new Error("nonce is required");
    }

    return {
        ...message,
        version: "1.0",
        payloadHash: createPayloadHash(message.payload),
    };
}
