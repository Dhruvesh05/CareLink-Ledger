import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const mockCreateAgent: any = jest.fn();

jest.mock("../agent/createAgent", () => ({
    createAgent: mockCreateAgent,
}));

import CredentialService from "../services/CredentialService";

describe("CredentialService", () => {
    const mockAgent: any = {
        createVerifiableCredential: jest.fn() as any,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateAgent.mockResolvedValue(mockAgent);
    });

    it("successful credential issuance", async () => {
        const issuerDid = "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT";
        const subjectDid = "did:key:z6MkgkJCVv7jVgN8S1eK1ZQ1vP3q5u9mY3yWwQF7mLzR9f3kT";
        const credentialSubject = { role: "doctor" };
        const issued = { credentialSubject: { id: subjectDid, role: "doctor" }, issuer: issuerDid };

        mockAgent.createVerifiableCredential.mockResolvedValue(issued);

        const result = await CredentialService.issueCredential(issuerDid, subjectDid, credentialSubject);

        expect(result).toEqual(issued);
        expect(mockAgent.createVerifiableCredential).toHaveBeenCalledWith(
            expect.objectContaining({
                proofFormat: "jwt",
                credential: expect.objectContaining({
                    issuer: issuerDid,
                    credentialSubject: expect.objectContaining({
                        id: subjectDid,
                        role: "doctor",
                    }),
                }),
            }),
        );
    });

    it("issuer DID is passed correctly", async () => {
        const issuerDid = "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT";
        const subjectDid = "did:key:z6MkgkJCVv7jVgN8S1eK1ZQ1vP3q5u9mY3yWwQF7mLzR9f3kT";
        mockAgent.createVerifiableCredential.mockResolvedValue({ issuer: issuerDid });

        await CredentialService.issueCredential(issuerDid, subjectDid, { role: "doctor" });

        expect(mockAgent.createVerifiableCredential).toHaveBeenCalledWith(
            expect.objectContaining({
                credential: expect.objectContaining({ issuer: issuerDid }),
            }),
        );
    });

    it("subject DID is passed correctly", async () => {
        const issuerDid = "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT";
        const subjectDid = "did:key:z6MkgkJCVv7jVgN8S1eK1ZQ1vP3q5u9mY3yWwQF7mLzR9f3kT";
        mockAgent.createVerifiableCredential.mockResolvedValue({ credentialSubject: { id: subjectDid } });

        await CredentialService.issueCredential(issuerDid, subjectDid, { role: "doctor" });

        expect(mockAgent.createVerifiableCredential).toHaveBeenCalledWith(
            expect.objectContaining({
                credential: expect.objectContaining({
                    credentialSubject: expect.objectContaining({ id: subjectDid }),
                }),
            }),
        );
    });

    it("credentialSubject claims are passed correctly", async () => {
        const issuerDid = "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT";
        const subjectDid = "did:key:z6MkgkJCVv7jVgN8S1eK1ZQ1vP3q5u9mY3yWwQF7mLzR9f3kT";
        const subject = { role: "doctor", department: "cardiology" };
        mockAgent.createVerifiableCredential.mockResolvedValue({ credentialSubject: { id: subjectDid, ...subject } });

        await CredentialService.issueCredential(issuerDid, subjectDid, subject);

        expect(mockAgent.createVerifiableCredential).toHaveBeenCalledWith(
            expect.objectContaining({
                credential: expect.objectContaining({
                    credentialSubject: expect.objectContaining({
                        id: subjectDid,
                        role: "doctor",
                        department: "cardiology",
                    }),
                }),
            }),
        );
    });

    it("missing issuer DID", async () => {
        await expect(CredentialService.issueCredential("", "did:key:test-subject", { role: "doctor" })).rejects.toThrow(
            "Issuer DID is required.",
        );
    });

    it("missing subject DID", async () => {
        await expect(CredentialService.issueCredential("did:key:test-issuer", "", { role: "doctor" })).rejects.toThrow(
            "Subject DID is required.",
        );
    });

    it("Veramo error propagation", async () => {
        const issuerDid = "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT";
        const subjectDid = "did:key:z6MkgkJCVv7jVgN8S1eK1ZQ1vP3q5u9mY3yWwQF7mLzR9f3kT";
        mockAgent.createVerifiableCredential.mockRejectedValue(new Error("credential signing failed"));

        await expect(CredentialService.issueCredential(issuerDid, subjectDid, { role: "doctor" })).rejects.toThrow(
            `Failed to issue credential for issuer "${issuerDid}": credential signing failed`,
        );
    });
});
