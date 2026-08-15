import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const mockCreateAgent: any = jest.fn();

jest.mock("../agent/createAgent", () => ({
    createAgent: mockCreateAgent,
}));

describe("CredentialPersistenceService", () => {
    const mockAgent: any = {
        dataStoreSaveVerifiableCredential: jest.fn() as any,
        dataStoreGetVerifiableCredential: jest.fn() as any,
        dataStoreORMGetVerifiableCredentialsByClaims: jest.fn() as any,
    };

    const validCredential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential"],
        issuer: "did:key:test-issuer",
        credentialSubject: { id: "did:key:test-subject", role: "doctor" },
        proof: { type: "JwtProof2020", jwt: "header.payload.signature" },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateAgent.mockResolvedValue(mockAgent);
    });

    it("saveCredential delegates to the Veramo data store and returns the stored id", async () => {
        mockAgent.dataStoreSaveVerifiableCredential.mockResolvedValue("credential-hash");

        const { default: CredentialPersistenceService } = await import("../services/CredentialPersistenceService");
        const result = await CredentialPersistenceService.saveCredential(validCredential);

        expect(result).toBe("credential-hash");
        expect(mockAgent.dataStoreSaveVerifiableCredential).toHaveBeenCalledWith({
            verifiableCredential: validCredential,
        });
    });

    it("getCredential delegates to the Veramo data store and returns the credential when found", async () => {
        mockAgent.dataStoreGetVerifiableCredential.mockResolvedValue(validCredential);

        const { default: CredentialPersistenceService } = await import("../services/CredentialPersistenceService");
        const result = await CredentialPersistenceService.getCredential("credential-hash");

        expect(result).toEqual(validCredential);
        expect(mockAgent.dataStoreGetVerifiableCredential).toHaveBeenCalledWith({ hash: "credential-hash" });
    });

    it("getCredential handles a missing credential by returning null", async () => {
        mockAgent.dataStoreGetVerifiableCredential.mockRejectedValue(new Error("not_found: Verifiable credential not found"));

        const { default: CredentialPersistenceService } = await import("../services/CredentialPersistenceService");
        const result = await CredentialPersistenceService.getCredential("missing-hash");

        expect(result).toBeNull();
    });

    it("getCredentialsBySubject delegates to the subject query and returns matching credentials", async () => {
        const subjectDid = "did:key:test-subject";
        const credentials = [{ ...validCredential, credentialSubject: { id: subjectDid, role: "doctor" } }];
        mockAgent.dataStoreORMGetVerifiableCredentialsByClaims.mockResolvedValue([
            { verifiableCredential: credentials[0] },
        ]);

        const { default: CredentialPersistenceService } = await import("../services/CredentialPersistenceService");
        const result = await CredentialPersistenceService.getCredentialsBySubject(subjectDid);

        expect(result).toEqual(credentials);
        expect(mockAgent.dataStoreORMGetVerifiableCredentialsByClaims).toHaveBeenCalledWith(
            { where: [{ column: "subject", value: [subjectDid] }] },
            {},
        );
    });

    it("invalid inputs are rejected before hitting the datastore", async () => {
        const { default: CredentialPersistenceService } = await import("../services/CredentialPersistenceService");

        await expect(CredentialPersistenceService.saveCredential({} as any)).rejects.toThrow(
            "Credential is required and must include @context, type, issuer, and credentialSubject.id.",
        );
        await expect(CredentialPersistenceService.getCredential("")).rejects.toThrow("Credential ID is required.");
        await expect(CredentialPersistenceService.getCredentialsBySubject("")).rejects.toThrow("Subject DID is required.");
        expect(mockAgent.dataStoreSaveVerifiableCredential).not.toHaveBeenCalled();
    });

    it("datastore failures are surfaced cleanly", async () => {
        mockAgent.dataStoreSaveVerifiableCredential.mockRejectedValue(new Error("database write failed"));

        const { default: CredentialPersistenceService } = await import("../services/CredentialPersistenceService");
        await expect(CredentialPersistenceService.saveCredential(validCredential)).rejects.toThrow(
            "Failed to save credential: database write failed",
        );
    });
});
