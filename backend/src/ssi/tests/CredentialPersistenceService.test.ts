import { describe, it, expect, beforeEach, jest } from "@jest/globals";

process.env.MEDICAL_RECORD_KEY_ENCRYPTION_SECRET =
    "credential-persistence-test-secret-32-characters";

jest.unstable_mockModule("../agent/createAgent.ts", () => ({
    createAgent: jest.fn(),
}));

const mockReferenceFindOne = jest.fn();
const mockReferenceCreate = jest.fn();

jest.unstable_mockModule("../../models/EncryptedCredentialReferenceModel", () => ({
    __esModule: true,
    default: {
        findOne: mockReferenceFindOne,
        create: mockReferenceCreate
    }
}));

const {
    CredentialPersistenceService: CredentialPersistenceServiceClass,
    default: CredentialPersistenceService
} =
    await import("../services/CredentialPersistenceService");
const { createAgent } =
    await import("../agent/createAgent.ts");

const mockCreateAgent = createAgent as jest.MockedFunction<typeof createAgent>;
const { InMemoryEncryptedKeyStore, KeyManagementService } =
    await import("../../services/encryption/KeyManagementService");
const { MedicalRecordEncryptionService } =
    await import("../../services/encryption/MedicalRecordEncryptionService");

describe("CredentialPersistenceService", () => {
    const mockAgent: any = {
        dataStoreSaveVerifiableCredential: jest.fn() as any,
        dataStoreGetVerifiableCredential: jest.fn() as any,
        dataStoreORMGetVerifiableCredentialsByClaims: jest.fn() as any,
        verifyCredential: jest.fn() as any,
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
        mockReferenceFindOne.mockReset();
        mockReferenceCreate.mockReset();
    });

    it("saveCredential delegates to the Veramo data store and returns the stored id", async () => {
        mockAgent.dataStoreSaveVerifiableCredential.mockResolvedValue("credential-hash");
        const result = await CredentialPersistenceService.saveCredential(validCredential);

        expect(result).toBe("credential-hash");
        expect(mockAgent.dataStoreSaveVerifiableCredential).toHaveBeenCalledWith({
            verifiableCredential: validCredential,
        });
    });

    it("getCredential delegates to the Veramo data store and returns the credential when found", async () => {
        mockAgent.dataStoreGetVerifiableCredential.mockResolvedValue(validCredential);
        const result = await CredentialPersistenceService.getCredential("credential-hash");

        expect(result).toEqual(validCredential);
        expect(mockAgent.dataStoreGetVerifiableCredential).toHaveBeenCalledWith({ hash: "credential-hash" });
    });

    it("getCredential handles a missing credential by returning null", async () => {
        mockAgent.dataStoreGetVerifiableCredential.mockRejectedValue(new Error("not_found: Verifiable credential not found"));
        const result = await CredentialPersistenceService.getCredential("missing-hash");

        expect(result).toBeNull();
    });

    it("getCredentialsBySubject delegates to the subject query and returns matching credentials", async () => {
        const subjectDid = "did:key:test-subject";
        const credentials = [{ ...validCredential, credentialSubject: { id: subjectDid, role: "doctor" } }];
        mockAgent.dataStoreORMGetVerifiableCredentialsByClaims.mockResolvedValue([
            { verifiableCredential: credentials[0] },
        ]);
        const result = await CredentialPersistenceService.getCredentialsBySubject(subjectDid);

        expect(result).toEqual(credentials);
        expect(mockAgent.dataStoreORMGetVerifiableCredentialsByClaims).toHaveBeenCalledWith(
            { where: [{ column: "subject", value: [subjectDid] }] },
            {},
        );
    });

    it("invalid inputs are rejected before hitting the datastore", async () => {

        await expect(CredentialPersistenceService.saveCredential({} as any)).rejects.toThrow(
            "Credential is required and must include @context, type, issuer, and credentialSubject.id.",
        );
        await expect(CredentialPersistenceService.getCredential("")).rejects.toThrow("Credential ID is required.");
        await expect(CredentialPersistenceService.getCredentialsBySubject("")).rejects.toThrow("Subject DID is required.");
        expect(mockAgent.dataStoreSaveVerifiableCredential).not.toHaveBeenCalled();
    });

    it("datastore failures are surfaced cleanly", async () => {
        mockAgent.dataStoreSaveVerifiableCredential.mockRejectedValue(new Error("database write failed"));

        await expect(CredentialPersistenceService.saveCredential(validCredential)).rejects.toThrow(
            "Failed to save credential: database write failed",
        );
    });

    it("encrypts and persists a credential reference without storing plaintext", async () => {
        mockAgent.dataStoreSaveVerifiableCredential.mockResolvedValue("credential-hash");
        mockReferenceFindOne.mockResolvedValue(null);
        mockReferenceCreate.mockResolvedValue({ _id: "reference-id" });

        const uploaded: Buffer[] = [];
        const service = new CredentialPersistenceServiceClass(
            mockCreateAgent,
            {
                uploadFile: jest.fn(async (content: Buffer) => {
                    uploaded.push(content);
                    return { cid: "bafy-credential-cid" };
                }),
                downloadFile: jest.fn(),
                unpinFile: jest.fn()
            } as any,
            new KeyManagementService(new InMemoryEncryptedKeyStore()),
            new MedicalRecordEncryptionService()
        );

        const result = await service.saveCredentialToIpfs(
            validCredential,
            "user-123",
            "did:key:test-subject"
        );

        expect(result).toEqual({
            credentialId: "credential-hash",
            referenceId: "reference-id",
            cid: "bafy-credential-cid"
        });
        expect(uploaded[0]).toBeDefined();
        expect(uploaded[0].toString("utf8")).not.toContain("did:key:test-subject");
        expect(mockReferenceCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user-123",
                subjectDid: "did:key:test-subject",
                credentialId: "credential-hash",
                cid: "bafy-credential-cid",
                encryptedHash: expect.any(String),
                encryptionKeyReference: expect.any(String)
            })
        );
    });

    it("retrieves, decrypts, and verifies an authorized credential reference", async () => {
        const keyStore = new InMemoryEncryptedKeyStore();
        const keyManagement = new KeyManagementService(keyStore);
        const encryption = new MedicalRecordEncryptionService();
        const managedKey = await keyManagement.createKey();
        const encrypted = encryption.encrypt(
            Buffer.from(JSON.stringify(validCredential)),
            managedKey.key,
            managedKey.reference
        );
        mockReferenceFindOne.mockResolvedValue({
            cid: "bafy-credential-cid",
            encryptedHash: (await import("../../utils/hash")).sha256FromBuffer(encrypted.ciphertext),
            encryptionVersion: encrypted.metadata.version,
            encryptionAlgorithm: encrypted.metadata.algorithm,
            encryptionIv: encrypted.metadata.iv,
            encryptionAuthTag: encrypted.metadata.authTag,
            encryptionKeyReference: encrypted.metadata.keyReference
        });
        const service = new CredentialPersistenceServiceClass(
            mockCreateAgent,
            {
                uploadFile: jest.fn(),
                downloadFile: jest.fn().mockResolvedValue(encrypted.ciphertext),
                unpinFile: jest.fn()
            } as any,
            keyManagement,
            encryption
        );

        await expect(
            service.getCredentialFromIpfs(
                "reference-id",
                "user-123",
                "did:key:test-subject"
            )
        ).resolves.toEqual(validCredential);
        expect(mockAgent.verifyCredential).toHaveBeenCalledWith({
            credential: validCredential
        });
    });

    it("reuses an existing reference on a safe retry", async () => {
        mockAgent.dataStoreSaveVerifiableCredential.mockResolvedValue("credential-hash");
        mockReferenceFindOne.mockResolvedValue({
            _id: "existing-reference",
            cid: "bafy-existing-cid"
        });
        const uploadFile = jest.fn();
        const service = new CredentialPersistenceServiceClass(
            mockCreateAgent,
            {
                uploadFile,
                downloadFile: jest.fn(),
                unpinFile: jest.fn()
            } as any,
            new KeyManagementService(new InMemoryEncryptedKeyStore()),
            new MedicalRecordEncryptionService()
        );

        await expect(
            service.saveCredentialToIpfs(
                validCredential,
                "user-123",
                "did:key:test-subject"
            )
        ).resolves.toEqual({
            credentialId: "credential-hash",
            referenceId: "existing-reference",
            cid: "bafy-existing-cid"
        });
        expect(uploadFile).not.toHaveBeenCalled();
        expect(mockReferenceCreate).not.toHaveBeenCalled();
    });

    it("recovers an existing reference after a concurrent duplicate insert", async () => {
        mockAgent.dataStoreSaveVerifiableCredential.mockResolvedValue("credential-hash");
        mockReferenceFindOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                _id: "raced-reference",
                cid: "bafy-raced-cid"
            });
        mockReferenceCreate.mockRejectedValue({ code: 11000 });
        const uploadFile = jest.fn().mockResolvedValue({ cid: "bafy-unneeded-cid" });
        const service = new CredentialPersistenceServiceClass(
            mockCreateAgent,
            { uploadFile, downloadFile: jest.fn(), unpinFile: jest.fn() } as any,
            new KeyManagementService(new InMemoryEncryptedKeyStore()),
            new MedicalRecordEncryptionService()
        );

        await expect(service.saveCredentialToIpfs(
            validCredential,
            "user-123",
            "did:key:test-subject"
        )).resolves.toEqual({
            credentialId: "credential-hash",
            referenceId: "raced-reference",
            cid: "bafy-raced-cid"
        });
        expect(uploadFile).toHaveBeenCalledTimes(1);
        expect(mockReferenceFindOne).toHaveBeenCalledTimes(2);
    });
});
