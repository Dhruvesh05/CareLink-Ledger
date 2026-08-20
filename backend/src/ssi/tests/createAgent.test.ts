import { describe, it, expect, jest } from "@jest/globals";

/*
 * --------------------------------------------------------------------------
 * Veramo mocks
 * --------------------------------------------------------------------------
 *
 * createAgent.ts dynamically imports Veramo packages. These mocks ensure
 * that this unit test never loads the real Veramo ESM implementations.
 */

// ---------------------------------------------------------------------------
// @veramo/core
// ---------------------------------------------------------------------------

jest.mock("@veramo/core", () => ({
    Agent: class MockAgent {
        plugins: any[];

        constructor(options: any) {
            this.plugins = options?.plugins || [];
        }

        async createDid({ provider }: any) {
            return {
                did: "did:key:z6MkjR9Xsampledidkey",
            };
        }

        async resolveDid({ did }: any) {
            return {
                didDocument: {
                    id: did,
                    "@context": "https://w3id.org/did/v1",
                },
            };
        }
    },
}));

// ---------------------------------------------------------------------------
// @veramo/key-manager
// ---------------------------------------------------------------------------

jest.mock("@veramo/key-manager", () => ({
    KeyManager: class MockKeyManager {
        constructor(options?: any) {}
    },
}));

// ---------------------------------------------------------------------------
// @veramo/did-manager
// ---------------------------------------------------------------------------

jest.mock("@veramo/did-manager", () => ({
    DIDManager: class MockDIDManager {
        constructor(options?: any) {}
    },
}));

// ---------------------------------------------------------------------------
// @veramo/did-provider-key
// ---------------------------------------------------------------------------

jest.mock("@veramo/did-provider-key", () => ({
    KeyDIDProvider: class MockKeyDIDProvider {
        constructor(options?: any) {}
    },

    getDidKeyResolver: () => ({
        "did:key": async () => ({
            didDocument: undefined,
        }),
    }),
}));

// ---------------------------------------------------------------------------
// @veramo/did-resolver
// ---------------------------------------------------------------------------

jest.mock("@veramo/did-resolver", () => ({
    DIDResolverPlugin: class MockDIDResolverPlugin {
        constructor(options?: any) {}
    },
}));

// ---------------------------------------------------------------------------
// @veramo/kms-local
// ---------------------------------------------------------------------------

jest.mock("@veramo/kms-local", () => ({
    KeyManagementSystem: class MockKeyManagementSystem {
        constructor(options?: any) {}
    },

    SecretBox: class MockSecretBox {
        constructor(secret?: any) {}
    },
}));

// ---------------------------------------------------------------------------
// @veramo/data-store
// ---------------------------------------------------------------------------

jest.mock("@veramo/data-store", () => ({
    KeyStore: class MockKeyStore {
        constructor(dataSource?: any) {}
    },

    PrivateKeyStore: class MockPrivateKeyStore {
        constructor(dataSource?: any, secretBox?: any) {}
    },

    DIDStore: class MockDIDStore {
        constructor(dataSource?: any) {}
    },

    DataStore: class MockDataStore {
        constructor(dataSource?: any) {}
    },

    DataStoreORM: class MockDataStoreORM {
        constructor(dataSource?: any) {}
    },

    Entities: [],

    migrations: [],

    MessageStore: class MockMessageStore {},

    MessageStoreORM: class MockMessageStoreORM {},

    MessageStoreModule: class MockMessageStoreModule {},
}));

// ---------------------------------------------------------------------------
// @veramo/credential-w3c
// ---------------------------------------------------------------------------
//
// IMPORTANT:
// The real @veramo/credential-w3c package is ESM. Jest 29 in this project
// runs the test environment in CommonJS mode, so loading the real package
// causes:
//
//   SyntaxError: Unexpected token 'export'
//
// This mock prevents Jest from loading the real ESM implementation.
// ---------------------------------------------------------------------------

jest.mock("@veramo/credential-w3c", () => ({
    CredentialPlugin: class MockCredentialPlugin {
        constructor(options?: any) {}
    },
}));

// ---------------------------------------------------------------------------
// @veramo/credential-jwt
// ---------------------------------------------------------------------------

jest.mock("@veramo/credential-jwt", () => ({
    CredentialProviderJWT: class MockCredentialProviderJWT {
        constructor(options?: any) {}
    },
}));

// ---------------------------------------------------------------------------
// Optional Veramo packages
// ---------------------------------------------------------------------------

jest.mock(
    "@veramo/kms-web3",
    () => ({
        KeyManagementSystem: class MockKeyManagementSystem {},
    }),
    { virtual: true }
);

jest.mock(
    "@veramo/kms-did-resolver",
    () => ({}),
    { virtual: true }
);

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { createAgent } from "../agent/createAgent";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SSI Veramo Agent foundation", () => {
    it("creates an agent and can create & resolve a did:key DID", async () => {
        const agent = await createAgent();

        expect(agent).toBeDefined();

        const createResult =
            await agent.createDid({
                provider: "did:key",
            });

        expect(createResult).toHaveProperty("did");

        expect(
            typeof createResult.did
        ).toBe("string");

        expect(
            createResult.did.startsWith("did:key:")
        ).toBe(true);

        const resolveResult =
            await agent.resolveDid({
                did: createResult.did,
            });

        expect(resolveResult).toHaveProperty(
            "didDocument"
        );

        expect(
            resolveResult.didDocument
        ).toHaveProperty(
            "id",
            createResult.did
        );
    });
});