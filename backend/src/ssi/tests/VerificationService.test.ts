import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const mockCreateAgent: any = jest.fn();

jest.mock("../agent/createAgent", () => ({
    createAgent: mockCreateAgent,
}));

import VerificationService from "../services/VerificationService";

describe("VerificationService", () => {
    const mockAgent: any = {
        verifyCredential: jest.fn() as any,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateAgent.mockResolvedValue(mockAgent);
    });

    it("returns verified true for a valid credential", async () => {
        const credential = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential"],
            issuer: "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT",
            credentialSubject: {
                id: "did:key:z6MkhUyxS9a9b4Y9Yz2kH4XkzJ7G2T4v6xJjQF7mLzR9f3kT",
                role: "doctor",
            },
            proof: {
                type: "JwtProof2020",
                jwt: "header.payload.signature",
            },
        };

        mockAgent.verifyCredential.mockResolvedValue({ verified: true });

        const result = await VerificationService.verifyCredential(credential as any);

        expect(result).toEqual({ verified: true });
        expect(mockCreateAgent).toHaveBeenCalledTimes(1);
        expect(mockAgent.verifyCredential).toHaveBeenCalledTimes(1);
        expect(mockAgent.verifyCredential).toHaveBeenCalledWith({ credential });
    });

    it("preserves verification failure details for an invalid credential", async () => {
        const credential = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential"],
            issuer: "did:key:test-issuer",
            credentialSubject: {
                id: "did:key:test-subject",
                role: "doctor",
            },
            proof: {
                type: "JwtProof2020",
                jwt: "header.payload.signature",
            },
        };

        mockAgent.verifyCredential.mockResolvedValue({
            verified: false,
            error: {
                message: "Credential verification failed.",
                errorCode: "verification_failed",
            },
        });

        const result = await VerificationService.verifyCredential(credential as any);

        expect(result).toEqual({
            verified: false,
            error: {
                message: "Credential verification failed.",
                errorCode: "verification_failed",
            },
        });
        expect(mockAgent.verifyCredential).toHaveBeenCalledWith({ credential });
    });

    it("handles Veramo rejection errors cleanly", async () => {
        const credential = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential"],
            issuer: "did:key:test-issuer",
            credentialSubject: {
                id: "did:key:test-subject",
                role: "doctor",
            },
        };

        mockAgent.verifyCredential.mockRejectedValue(new Error("JWT signature invalid"));

        const result = await VerificationService.verifyCredential(credential as any);

        expect(result).toEqual({
            verified: false,
            error: {
                message: "JWT signature invalid",
                errorCode: "verification_error",
            },
        });
    });

    it("delegates to createAgent and calls verifyCredential exactly once", async () => {
        const credential = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential"],
            issuer: "did:key:test-issuer",
            credentialSubject: {
                id: "did:key:test-subject",
                role: "doctor",
            },
        };

        mockAgent.verifyCredential.mockResolvedValue({ verified: true });

        await VerificationService.verifyCredential(credential as any);

        expect(mockCreateAgent).toHaveBeenCalledTimes(1);
        expect(mockAgent.verifyCredential).toHaveBeenCalledTimes(1);
        expect(mockAgent.verifyCredential).toHaveBeenCalledWith({ credential });
    });
});
