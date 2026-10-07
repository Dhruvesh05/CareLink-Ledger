import { describe, expect, it } from "@jest/globals";
import { randomBytes } from "crypto";

import {
    MedicalRecordEncryptionService,
} from "./MedicalRecordEncryptionService";

describe("MedicalRecordEncryptionService", () => {
    const service = new MedicalRecordEncryptionService();
    const key = randomBytes(32);

    it("round-trips empty, small, and normal buffers", () => {
        for (const plaintext of [
            Buffer.alloc(0),
            Buffer.from("x"),
            Buffer.from("medical-record-content"),
        ]) {
            const encrypted = service.encrypt(
                plaintext,
                key,
                "medical-record:test-key"
            );

            expect(
                service.decrypt(
                    encrypted.ciphertext,
                    key,
                    encrypted.metadata
                )
            ).toEqual(plaintext);
        }
    });

    it("generates a fresh IV for independent encryptions", () => {
        const first = service.encrypt(
            Buffer.from("same-content"),
            key,
            "medical-record:test-key"
        );
        const second = service.encrypt(
            Buffer.from("same-content"),
            key,
            "medical-record:test-key"
        );

        expect(first.metadata.iv).not.toBe(second.metadata.iv);
        expect(first.ciphertext).not.toEqual(second.ciphertext);
    });

    it("rejects tampered ciphertext and authentication tags", () => {
        const encrypted = service.encrypt(
            Buffer.from("protected-content"),
            key,
            "medical-record:test-key"
        );
        const tamperedCiphertext = Buffer.from(encrypted.ciphertext);
        tamperedCiphertext[0] ^= 1;

        expect(() =>
            service.decrypt(
                tamperedCiphertext,
                key,
                encrypted.metadata
            )
        ).toThrow();

        const tamperedTag = {
            ...encrypted.metadata,
            authTag: Buffer.from(
                Buffer.from(
                    encrypted.metadata.authTag,
                    "base64"
                ).map((value, index) =>
                    index === 0 ? value ^ 1 : value
                )
            ).toString("base64"),
        };

        expect(() =>
            service.decrypt(
                encrypted.ciphertext,
                key,
                tamperedTag
            )
        ).toThrow();
    });

    it("rejects invalid keys and malformed encryption metadata", () => {
        expect(() =>
            service.encrypt(
                Buffer.from("content"),
                Buffer.alloc(31),
                "medical-record:test-key"
            )
        ).toThrow("must be 32 bytes");

        const encrypted = service.encrypt(
            Buffer.from("content"),
            key,
            "medical-record:test-key"
        );

        expect(() =>
            service.decrypt(
                encrypted.ciphertext,
                key,
                {
                    ...encrypted.metadata,
                    iv: "invalid",
                }
            )
        ).toThrow("IV is invalid");
    });
});
