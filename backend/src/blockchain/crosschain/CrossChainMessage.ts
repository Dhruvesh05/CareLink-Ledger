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

export function validateCrossChainMessage(
    message: CrossChainMessage
): void {
    if (
        !message ||
        typeof message !== "object"
    ) {
        throw new Error("Cross-chain message is required");
    }

    if (message.version !== "1.0") {
        throw new Error("Unsupported cross-chain message version");
    }

    if (
        !Object.values(BlockchainType).includes(
            message.sourceChain
        ) ||
        !Object.values(BlockchainType).includes(
            message.destinationChain
        )
    ) {
        throw new Error("Unsupported cross-chain network");
    }

    if (message.sourceChain === BlockchainType.BRIDGE) {
        throw new Error("Bridge cannot be used as a source chain");
    }

    if (
        typeof message.messageId !== "string" ||
        !message.messageId.trim()
    ) {
        throw new Error("messageId is required");
    }

    if (
        typeof message.messageType !== "string" ||
        !message.messageType.trim()
    ) {
        throw new Error("messageType is required");
    }

    if (
        typeof message.timestamp !== "string" ||
        !message.timestamp.trim()
    ) {
        throw new Error("timestamp is required");
    }

    if (
        typeof message.nonce !== "string" ||
        !message.nonce.trim()
    ) {
        throw new Error("nonce is required");
    }

    if (
        typeof message.payloadHash !== "string" ||
        !/^[a-f0-9]{64}$/i.test(message.payloadHash)
    ) {
        throw new Error("Invalid cross-chain payload hash");
    }

    if (
        message.payloadHash !==
        createPayloadHash(message.payload)
    ) {
        throw new Error("Cross-chain payload integrity check failed");
    }
}
