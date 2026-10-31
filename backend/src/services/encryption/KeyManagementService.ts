import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes
} from "crypto";

import MedicalRecordEncryptionKeyModel
    from "../../models/MedicalRecordEncryptionKeyModel";

export interface ManagedKey {
    readonly reference: string;
    readonly key: Buffer;
}

export interface KeyManagement {
    createKey(): Promise<ManagedKey>;
    getKey(reference: string): Promise<Buffer>;
}

export interface EncryptedKeyRecord {
    reference: string;
    iv: string;
    ciphertext: string;
    authTag: string;
}

export interface EncryptedKeyStore {
    save(record: EncryptedKeyRecord): Promise<void>;
    find(reference: string): Promise<EncryptedKeyRecord | null>;
}

export class KeyNotFoundError extends Error {
    constructor(reference: string) {
        super(`Encryption key is unavailable for reference "${reference}".`);
        this.name = "KeyNotFoundError";
    }
}

/**
 * Production store. Only master-key-encrypted key material is persisted.
 */
export class MongoEncryptedKeyStore implements EncryptedKeyStore {
    async save(record: EncryptedKeyRecord): Promise<void> {
        await MedicalRecordEncryptionKeyModel.create({
            reference: record.reference,
            iv: record.iv,
            encryptedKey: record.ciphertext,
            authTag: record.authTag
        });
    }

    async find(reference: string): Promise<EncryptedKeyRecord | null> {
        const record = await MedicalRecordEncryptionKeyModel
            .findOne({ reference })
            .lean()
            .exec();

        if (!record) {
            return null;
        }

        return {
            reference: record.reference,
            iv: record.iv,
            ciphertext: record.encryptedKey,
            authTag: record.authTag
        };
    }
}

/**
 * Test-only adapter. It stores encrypted key records, never plaintext keys.
 */
export class InMemoryEncryptedKeyStore implements EncryptedKeyStore {
    private readonly records = new Map<string, EncryptedKeyRecord>();

    async save(record: EncryptedKeyRecord): Promise<void> {
        this.records.set(record.reference, { ...record });
    }

    async find(reference: string): Promise<EncryptedKeyRecord | null> {
        const record = this.records.get(reference);
        return record ? { ...record } : null;
    }
}

export class KeyManagementService implements KeyManagement {
    constructor(
        private readonly store: EncryptedKeyStore = new MongoEncryptedKeyStore()
    ) {}

    private getWrappingKey(): Buffer {
        const secret = process.env.MEDICAL_RECORD_KEY_ENCRYPTION_SECRET;

        if (typeof secret !== "string" || secret.trim().length < 32) {
            throw new Error(
                "MEDICAL_RECORD_KEY_ENCRYPTION_SECRET must be configured " +
                "with at least 32 characters."
            );
        }

        return createHash("sha256").update(secret, "utf8").digest();
    }

    async createKey(): Promise<ManagedKey> {
        const reference =
            `medical-record:${randomBytes(16).toString("hex")}`;
        const key = randomBytes(32);
        const iv = randomBytes(12);

        const cipher = createCipheriv(
            "aes-256-gcm",
            this.getWrappingKey(),
            iv
        );

        const ciphertext = Buffer.concat([
            cipher.update(key),
            cipher.final()
        ]);

        await this.store.save({
            reference,
            iv: iv.toString("base64"),
            ciphertext: ciphertext.toString("base64"),
            authTag: cipher.getAuthTag().toString("base64")
        });

        return {
            reference,
            key: Buffer.from(key)
        };
    }

    async getKey(reference: string): Promise<Buffer> {
        if (typeof reference !== "string" || !reference.trim()) {
            throw new KeyNotFoundError(String(reference));
        }

        const stored = await this.store.find(reference);

        if (!stored) {
            throw new KeyNotFoundError(reference);
        }

        try {
            const decipher = createDecipheriv(
                "aes-256-gcm",
                this.getWrappingKey(),
                Buffer.from(stored.iv, "base64")
            );

            decipher.setAuthTag(Buffer.from(stored.authTag, "base64"));

            const key = Buffer.concat([
                decipher.update(Buffer.from(stored.ciphertext, "base64")),
                decipher.final()
            ]);

            if (key.length !== 32) {
                throw new Error("Invalid decrypted key length.");
            }

            return Buffer.from(key);
        } catch {
            throw new Error(
                "Stored encryption key could not be decrypted. " +
                "Verify that MEDICAL_RECORD_KEY_ENCRYPTION_SECRET matches " +
                "the secret used when the key was stored."
            );
        }
    }
}

export const keyManagementService = new KeyManagementService();

export default KeyManagementService;
