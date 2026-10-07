import { describe, expect, it } from "@jest/globals";

import { KeyManagementService } from "./KeyManagementService";

describe("KeyManagementService", () => {
    it("generates and retrieves keys by non-secret reference", async () => {
        const service = new KeyManagementService();
        const managedKey = await service.createKey();

        expect(managedKey.reference).toMatch(/^medical-record:/);
        expect(managedKey.key).toHaveLength(32);
        expect(await service.getKey(managedKey.reference)).toEqual(
            managedKey.key
        );
    });

    it("does not expose keys for unknown references", async () => {
        const service = new KeyManagementService();

        await expect(
            service.getKey("medical-record:missing")
        ).rejects.toThrow("Encryption key is unavailable");
    });
});
