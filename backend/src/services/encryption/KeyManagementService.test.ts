import { describe, expect, it } from "@jest/globals";

import {
    InMemoryEncryptedKeyStore,
    KeyManagementService
} from "./KeyManagementService";

process.env.MEDICAL_RECORD_KEY_ENCRYPTION_SECRET =
    "unit-test-only-master-secret-not-for-production";

describe("KeyManagementService", () => {
    it("generates keys and retrieves them from encrypted stored records", async () => {
        const store = new InMemoryEncryptedKeyStore();
        const creator = new KeyManagementService(store);
        const managedKey = await creator.createKey();

        expect(managedKey.reference).toMatch(/^medical-record:/);
        expect(managedKey.key).toHaveLength(32);

        // A separate service instance simulates a backend process restart.
        const reader = new KeyManagementService(store);
        expect(await reader.getKey(managedKey.reference)).toEqual(
            managedKey.key
        );
    });

    it("does not expose keys for unknown references", async () => {
        const service = new KeyManagementService(
            new InMemoryEncryptedKeyStore()
        );

        await expect(
            service.getKey("medical-record:missing")
        ).rejects.toThrow("Encryption key is unavailable");
    });
});
