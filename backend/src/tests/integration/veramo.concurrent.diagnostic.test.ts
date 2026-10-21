
import { describe, expect, it } from "@jest/globals";

describe("Veramo sequential ESM diagnostic", () => {
    it("loads Veramo packages one at a time", async () => {
        const core = await import("@veramo/core");
        expect(core).toBeDefined();

        const keyManager = await import("@veramo/key-manager");
        expect(keyManager).toBeDefined();

        const dataStore = await import("@veramo/data-store");
        expect(dataStore).toBeDefined();

        const kmsLocal = await import("@veramo/kms-local");
        expect(kmsLocal).toBeDefined();

        const didManager = await import("@veramo/did-manager");
        expect(didManager).toBeDefined();

        const didProviderKey = await import("@veramo/did-provider-key");
        expect(didProviderKey).toBeDefined();

        const didResolver = await import("@veramo/did-resolver");
        expect(didResolver).toBeDefined();

        const credentialW3c = await import("@veramo/credential-w3c");
        expect(credentialW3c).toBeDefined();

        const credentialJwt = await import("@veramo/credential-jwt");
        expect(credentialJwt).toBeDefined();
    });
});
