import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
} from "crypto";

export const MEDICAL_RECORD_ENCRYPTION_VERSION = 1;
export const MEDICAL_RECORD_ENCRYPTION_ALGORITHM = "aes-256-gcm";
export const MEDICAL_RECORD_ENCRYPTION_IV_BYTES = 12;
export const MEDICAL_RECORD_ENCRYPTION_KEY_BYTES = 32;
export const MEDICAL_RECORD_ENCRYPTION_TAG_BYTES = 16;

export interface MedicalRecordEncryptionMetadata {
    version: number;
    algorithm: typeof MEDICAL_RECORD_ENCRYPTION_ALGORITHM;
    iv: string;
    authTag: string;
    keyReference: string;
}

export interface EncryptedMedicalRecord {
    ciphertext: Buffer;
    metadata: MedicalRecordEncryptionMetadata;
}

export class MedicalRecordEncryptionService {
    encrypt(
        plaintext: Buffer,
        key: Buffer,
        keyReference: string
    ): EncryptedMedicalRecord {
        if (!Buffer.isBuffer(plaintext)) {
            throw new Error("Medical record content must be a Buffer.");
        }

        this.validateKey(key);

        if (typeof keyReference !== "string" || !keyReference.trim()) {
            throw new Error("Encryption key reference is required.");
        }

        const iv = randomBytes(MEDICAL_RECORD_ENCRYPTION_IV_BYTES);
        const cipher = createCipheriv(
            MEDICAL_RECORD_ENCRYPTION_ALGORITHM,
            key,
            iv
        );
        const ciphertext = Buffer.concat([
            cipher.update(plaintext),
            cipher.final(),
        ]);

        return {
            ciphertext,
            metadata: {
                version: MEDICAL_RECORD_ENCRYPTION_VERSION,
                algorithm: MEDICAL_RECORD_ENCRYPTION_ALGORITHM,
                iv: iv.toString("base64"),
                authTag: cipher.getAuthTag().toString("base64"),
                keyReference: keyReference.trim(),
            },
        };
    }

    decrypt(
        ciphertext: Buffer,
        key: Buffer,
        metadata: MedicalRecordEncryptionMetadata
    ): Buffer {
        if (!Buffer.isBuffer(ciphertext)) {
            throw new Error("Encrypted medical record content must be a Buffer.");
        }

        this.validateKey(key);
        const normalized = this.validateMetadata(metadata);
        const decipher = createDecipheriv(
            normalized.algorithm,
            key,
            Buffer.from(normalized.iv, "base64")
        );

        decipher.setAuthTag(Buffer.from(normalized.authTag, "base64"));

        return Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
    }

    private validateKey(key: Buffer): void {
        if (
            !Buffer.isBuffer(key) ||
            key.length !== MEDICAL_RECORD_ENCRYPTION_KEY_BYTES
        ) {
            throw new Error("Medical record encryption key must be 32 bytes.");
        }
    }

    private validateMetadata(
        metadata: MedicalRecordEncryptionMetadata
    ): MedicalRecordEncryptionMetadata {
        if (!metadata || typeof metadata !== "object") {
            throw new Error("Medical record encryption metadata is required.");
        }

        if (metadata.version !== MEDICAL_RECORD_ENCRYPTION_VERSION) {
            throw new Error("Unsupported medical record encryption version.");
        }

        if (metadata.algorithm !== MEDICAL_RECORD_ENCRYPTION_ALGORITHM) {
            throw new Error("Unsupported medical record encryption algorithm.");
        }

        if (
            typeof metadata.keyReference !== "string" ||
            !metadata.keyReference.trim()
        ) {
            throw new Error("Medical record encryption key reference is required.");
        }

        const iv = this.decodeBase64(
            metadata.iv,
            MEDICAL_RECORD_ENCRYPTION_IV_BYTES,
            "IV"
        );
        const authTag = this.decodeBase64(
            metadata.authTag,
            MEDICAL_RECORD_ENCRYPTION_TAG_BYTES,
            "authentication tag"
        );

        return {
            ...metadata,
            iv: iv.toString("base64"),
            authTag: authTag.toString("base64"),
            keyReference: metadata.keyReference.trim(),
        };
    }

    private decodeBase64(
        value: unknown,
        expectedBytes: number,
        field: string
    ): Buffer {
        if (typeof value !== "string" || !value.trim()) {
            throw new Error(`Medical record encryption ${field} is required.`);
        }

        const decoded = Buffer.from(value, "base64");

        if (
            decoded.length !== expectedBytes ||
            decoded.toString("base64") !== value
        ) {
            throw new Error(`Medical record encryption ${field} is invalid.`);
        }

        return decoded;
    }
}

export default MedicalRecordEncryptionService;
