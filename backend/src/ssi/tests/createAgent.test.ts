import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock dynamic imports of Veramo modules used by createAgent
jest.mock("@veramo/core", () => ({
    Agent: class MockAgent {
        plugins: any[];
        constructor(options: any) {
            this.plugins = options?.plugins || [];
        }
        async createDid({ provider }: any) {
            // return a realistic did:key-like identifier for tests
            return { did: "did:key:z6MkjR9Xsampledidkey" };
        }
        async resolveDid({ did }: any) {
            return { didDocument: { id: did, "@context": "https://w3id.org/did/v1" } };
        }
    }
}));

jest.mock("@veramo/key-manager", () => ({
    KeyManager: class {}
}));

jest.mock("@veramo/did-manager", () => ({
    DIDManager: class {
        constructor(opts: any) {}
    }
}));

jest.mock("@veramo/did-provider-key", () => ({
    KeyDIDProvider: class {},
    getDidKeyResolver: () => ({ "did:key": async () => ({}) })
}));

jest.mock("@veramo/did-resolver", () => ({
    DIDResolverPlugin: class {
        constructor(opts: any) {}
    }
}));

jest.mock("@veramo/kms-local", () => ({
    KeyManagementSystem: class {}
}));

jest.mock("@veramo/kms-web3", () => ({
    KeyManagementSystem: class {}
}));

jest.mock("@veramo/kms-did-resolver", () => ({}));

jest.mock("@veramo/data-store", () => ({
    DataStore: class {},
    DataStoreORM: class {},
    Entities: {},
    migrations: [],
    MessageStore: class {},
    MessageStoreORM: class {},
    MessageStoreModule: class {}
}));

import { createAgent } from "../agent/createAgent";

describe("SSI Veramo Agent foundation", () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it("creates an agent and can create & resolve a did:key DID", async () => {
        const agent = await createAgent();
        expect(agent).toBeDefined();

        const createResult = await agent.createDid({ provider: "did:key" });
        expect(createResult).toHaveProperty("did");
        expect(typeof createResult.did).toBe("string");
        expect(createResult.did.startsWith("did:key:")).toBe(true);

        const resolveResult = await agent.resolveDid({ did: createResult.did });
        expect(resolveResult).toHaveProperty("didDocument");
        expect(resolveResult.didDocument).toHaveProperty("id", createResult.did);
    });
});
