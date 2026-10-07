import { randomBytes } from "crypto";

export interface ManagedKey {
    readonly reference: string;
    readonly key: Buffer;
}

export interface KeyManagement {
    createKey(): Promise<ManagedKey>;
    getKey(reference: string): Promise<Buffer>;
}

export class KeyNotFoundError extends Error {
    constructor(reference: string) {
        super(`Encryption key is unavailable for reference "${reference}".`);
        this.name = "KeyNotFoundError";
    }
}

/**
 * Development key-management boundary.
 *
 * The key material remains server-side and is never persisted with record
 * metadata. A production deployment can replace this implementation with a
 * KMS/HSM-backed service without changing the medical-record workflow.
 */
export class KeyManagementService implements KeyManagement {
    private readonly keys = new Map<string, Buffer>();

    async createKey(): Promise<ManagedKey> {
        const reference = `medical-record:${randomBytes(16).toString("hex")}`;
        const key = randomBytes(32);

        this.keys.set(reference, key);

        return {
            reference,
            key: Buffer.from(key),
        };
    }

    async getKey(reference: string): Promise<Buffer> {
        if (typeof reference !== "string" || !reference.trim()) {
            throw new KeyNotFoundError(String(reference));
        }

        const key = this.keys.get(reference);

        if (!key) {
            throw new KeyNotFoundError(reference);
        }

        return Buffer.from(key);
    }
}

export const keyManagementService =
    new KeyManagementService();

export default KeyManagementService;
